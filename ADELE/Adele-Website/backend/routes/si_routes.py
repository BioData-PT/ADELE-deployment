from datetime import datetime, timedelta
from minio import Minio, S3Error
from flask import Blueprint, make_response, request, jsonify, send_file
import requests
from config.settings import *
from utils import fdp_utils, util
from pymongo import MongoClient
import jwt
import logging
import os
from bson import ObjectId
import subprocess
import tempfile
import shutil

si_bp = Blueprint('si', __name__)

# Initialize MongoDB client
client = MongoClient(MONGO_URI)
dbProject = client["project"]
projectDB = dbProject["project_details"]

filesDB = dbProject["files"]

PUBLIC_KEY_PATH = "/backend/config/c4gh.pub"
CHECKSUM_PATH = "/backend/config/c4gh.pub.pem.sha256"

INBOX_BUCKET = "inbox"

# === Audit Logger Setup (reuse the same file as server.py) ===
AUDIT_LOG_FILE = os.path.join(os.path.dirname(__file__), '..', 'audit.log')
audit_logger = logging.getLogger("TRE-BIODATA-AUDIT")
if not audit_logger.hasHandlers():
    audit_logger.setLevel(logging.INFO)
    audit_handler = logging.FileHandler(AUDIT_LOG_FILE, encoding='utf-8')
    audit_handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s'))
    audit_logger.addHandler(audit_handler)

@si_bp.route('/files', methods=['GET'])
def get_files():
    """
    Get a list of files from the FDP.
    """
    user_ip = request.remote_addr
    request_data = request.args.get('id')
    user_id = "unknown"
    audit_logger.info(f"SI_GET_FILES | IP={user_ip} | request_data_present={bool(request_data)}")

    if not request_data:
        audit_logger.warning(f"SI_GET_FILES | MISSING_REQUEST_DATA | IP={user_ip}")
        return jsonify({"error": "No request data provided"}), 400

    try:
        passport = jwt.decode(request_data, options={"verify_signature": False})
        user_id = passport.get('sub', 'unknown')
        audit_logger.info(f"SI_GET_FILES | JWT_DECODED | user_id={user_id} | IP={user_ip}")
    except Exception as e:
        audit_logger.error(f"SI_GET_FILES | INVALID_JWT | IP={user_ip} | error={str(e)}")
        return jsonify({"error": f"Invalid JWT: {str(e)}"}), 401

    visa = passport.get('ga4gh_visa_v1')
    if not visa or visa.get('type') != 'ControlledAccessGrants':
        audit_logger.info(f"SI_GET_FILES | NO_CONTROLLED_ACCESS | user_id={user_id} | IP={user_ip}")
        return jsonify({"dataset": None, "files": []}), 200

    dataset_id = visa.get('value')
    if not dataset_id:
        audit_logger.warning(f"SI_GET_FILES | MISSING_DATASET_ID | user_id={user_id} | IP={user_ip}")
        return jsonify({"error": "Missing dataset value in visa"}), 400

    access_token = request.cookies.get('access_token')
    if not access_token:
        audit_logger.warning(f"SI_GET_FILES | MISSING_ACCESS_TOKEN | user_id={user_id} | IP={user_ip}")
        return jsonify({"error": "Missing access token in cookies"}), 401

    headers = {
        'Authorization': f"Bearer {access_token}",
        'Content-Type': 'application/json'
    }

    try:
        response = requests.get(
            f"{DOWNLOAD_S3}/metadata/datasets/{dataset_id}/files",
            headers=headers,
            timeout=10
        )
        response.raise_for_status()
        audit_logger.info(f"SI_GET_FILES | FILES_FETCHED | user_id={user_id} | dataset_id={dataset_id} | IP={user_ip} | status={response.status_code}")
    except requests.RequestException as e:
        audit_logger.error(f"SI_GET_FILES | FILES_FETCH_FAIL | user_id={user_id} | dataset_id={dataset_id} | IP={user_ip} | error={str(e)}")
        return jsonify({"error": f"Failed to fetch files: {str(e)}"}), 502

    try:
        response_data = response.json()
    except ValueError:
        audit_logger.error(f"SI_GET_FILES | INVALID_JSON_RESPONSE | user_id={user_id} | dataset_id={dataset_id} | IP={user_ip}")
        return jsonify({"error": "Invalid JSON response from file server"}), 502

    files = []
    for file in response_data:
        if all(k in file for k in ('fileId', 'displayFileName', 'fileStatus')):
            files.append({
                'id': file['fileId'],
                'status': file['fileStatus']
            })

    # Resolve a human-readable dataset name from the REMS catalogue item whose
    # resource id matches this dataset; fall back to the raw id if not found.
    dataset_name = dataset_id
    try:
        rems_resp = requests.get(
            f"{REMS_API}/catalogue-items",
            headers={"x-rems-api-key": REMS_API_KEY, "x-rems-user-id": REMS_USER_ID},
            timeout=10
        )
        if rems_resp.ok:
            for item in rems_resp.json():
                if item.get('resid') == dataset_id:
                    title = item.get('localizations', {}).get('en', {}).get('title')
                    if title:
                        dataset_name = title
                        break
    except requests.RequestException as e:
        audit_logger.warning(f"SI_GET_FILES | REMS_NAME_LOOKUP_FAIL | dataset_id={dataset_id} | error={str(e)}")

    audit_logger.info(f"SI_GET_FILES | SUCCESS | user_id={user_id} | dataset_id={dataset_id} | IP={user_ip} | files_count={len(files)}")
    return jsonify({"dataset": dataset_id, "dataset_name": dataset_name, "files": files}), 200


@si_bp.route('/files/<file_id>', methods=['GET'])
def get_file(file_id):
    """
    Get details of a specific file from the FDP.
    """
    user_ip = request.remote_addr
    access_token = request.cookies.get('access_token')
    if not access_token:
        audit_logger.warning(f"SI_GET_FILE | MISSING_ACCESS_TOKEN | IP={user_ip}")
        return jsonify({"error": "Missing access token in cookies"}), 401

    headers = {
        'Authorization': f"Bearer {access_token}",
        'Content-Type': 'application/json'
    }

    try:
        response = requests.get(
            f"{DOWNLOAD_S3}/files/{file_id}",
            headers=headers,
            timeout=10
        )
        response.raise_for_status()
        audit_logger.info(f"SI_GET_FILE | FILE_FETCHED | file_id={file_id} | IP={user_ip} | status={response.status_code}")
    except requests.RequestException as e:
        audit_logger.error(f"SI_GET_FILE | FILE_FETCH_FAIL | file_id={file_id} | IP={user_ip} | error={str(e)}")
        return jsonify({"error": f"Failed to fetch file: {str(e)}"}), 502

    try:
        file_data = response.json()
    except ValueError:
        audit_logger.error(f"SI_GET_FILE | INVALID_JSON_RESPONSE | file_id={file_id} | IP={user_ip}")
        return jsonify({"error": "Invalid JSON response from file server"}), 502

    audit_logger.info(f"SI_GET_FILE | SUCCESS | file_id={file_id} | IP={user_ip}")

    
    return jsonify(file_data), 200

@si_bp.route("/generate-presigned-uri/<username>/<filename>", methods=["GET"])
def generate_presigned_uri(username, filename):

    access_token = request.cookies.get('access_token')
    if not access_token:
        return jsonify({"error": "Missing access token in cookies"}), 401

    # Decode the JWT to get the current user
    try:
        passport = jwt.decode(access_token, options={"verify_signature": False})
        current_user = passport.get('sub', 'unknown')
    except Exception as e:
        print(f"[ERROR] Failed to decode JWT: {e}")
        return jsonify({"error": "Invalid access token"}), 401

    if current_user != username:
        return jsonify({"error": "Unauthorized access"}), 403

    # The S3 store is only reachable inside the docker network, so an S3
    # presigned URL is not usable by the browser. Hand back a URL to this
    # backend's own streaming endpoint instead.
    result_url = f"{request.host_url}si/result/{username}/{filename}"
    return jsonify({"presigned_uri": result_url, "uri": result_url}), 200


@si_bp.route("/result/<username>/<path:filename>", methods=["GET"])
def get_task_result(username, filename):
    """Stream an approved task-output object from the 'results' bucket."""
    access_token = request.cookies.get('access_token')
    if not access_token:
        return jsonify({"error": "Missing access token in cookies"}), 401

    try:
        passport = jwt.decode(access_token, options={"verify_signature": False})
        current_user = passport.get('sub', 'unknown')
    except Exception as e:
        return jsonify({"error": "Invalid access token"}), 401

    if current_user != username:
        return jsonify({"error": "Unauthorized access"}), 403

    minio_client = Minio(
        MINIO_ENDPOINT,
        access_key=MINIO_ACCESS_KEY,
        secret_key=MINIO_SECRET_KEY,
        secure=False
    )

    try:
        obj = minio_client.get_object("results", f"{username}/{filename}")
        data = obj.read()
        obj.close()
        obj.release_conn()
    except S3Error as e:
        return jsonify({"error": f"Result not found: {str(e)}"}), 404

    resp = make_response(data)
    resp.headers["Content-Type"] = "text/plain; charset=utf-8"
    return resp


@si_bp.route("/upload/file/<filename>", methods=["POST"])
def upload_file(filename):
    """
    Upload a file using sda-cli.
    """
    user_ip = request.remote_addr
    access_token = request.cookies.get('access_token')
    if not access_token:
        audit_logger.warning(f"SI_UPLOAD_FILE | MISSING_ACCESS_TOKEN | IP={user_ip}")
        return jsonify({"error": "Missing access token in cookies"}), 401    
    
    project_id = request.form.get('project_id')
    if not project_id:
        audit_logger.warning(f"SI_UPLOAD_FILE | MISSING_PROJECT_ID | IP={user_ip}")
        return jsonify({"error": "Missing project ID"}), 400

    # Decode the JWT to get the current user
    try:
        passport = jwt.decode(access_token, options={"verify_signature": False})
        current_user = passport.get('sub', 'unknown')
        audit_logger.info(f"SI_UPLOAD_FILE | JWT_DECODED | user_id={current_user} | IP={user_ip}")
    except Exception as e:
        audit_logger.error(f"SI_UPLOAD_FILE | INVALID_JWT | IP={user_ip} | error={str(e)}")
        return jsonify({"error": f"Invalid access token: {str(e)}"}), 401

    # Check if the file is provided in the request
    if 'file' not in request.files:
        audit_logger.warning(f"SI_UPLOAD_FILE | MISSING_FILE | user_id={current_user} | IP={user_ip}")
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']
    if file.filename == '':
        audit_logger.warning(f"SI_UPLOAD_FILE | EMPTY_FILENAME | user_id={current_user} | IP={user_ip}")
        return jsonify({"error": "No selected file"}), 400

    # Insert file record in DB
    file_id = filesDB.insert_one({
        "filename": file.filename,
        "user": current_user,
        "project_id": project_id,
        "upload_time": datetime.now(),
        "archived": False
    })
    file_id_str = str(file_id.inserted_id) + ".c4gh"

    audit_logger.info(f"SI_UPLOAD_FILE | FILE_ADDED_TO_DB | user_id={current_user} | file_id={file_id_str} | IP={user_ip}")

    PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
    SHARED_BASE_DIR = os.path.abspath(os.path.join(PROJECT_ROOT, "..", "..", "..", "tre-shared-documents"))
    TEMP_DIR = os.path.join(SHARED_BASE_DIR, "tmp")
    if not os.path.exists(TEMP_DIR):
        os.makedirs(TEMP_DIR)

    file_path = os.path.join(TEMP_DIR, file_id_str)
    file.save(file_path)

    if not file_path.endswith(".c4gh"):
        file_path += ".c4gh"

    temp_config = None
    sda_script = "/backend/config/sda-cli"
    try:
        with tempfile.NamedTemporaryFile(delete=False, mode="w", suffix=".conf") as temp_config:
            with open("/backend/config/s3cmd.conf", "r") as base_config:
                config = base_config.read()

            config = config.replace("ACCESS_TOKEN", access_token)
            config = config.replace("ACCESS_KEY", current_user.replace("@", "_"))
            config = config.replace("SECRET_KEY", current_user.replace("@", "_"))

            temp_config.write(config)
            temp_config_path = temp_config.name

        sda_cmd = [sda_script, "-config", temp_config_path, "upload", file_path]
        result = subprocess.run(sda_cmd, capture_output=True, text=True)
        audit_logger.info(f"SI_UPLOAD_FILE | SDA_UPLOAD | stdout={result.stdout} | stderr={result.stderr}")

        if result.returncode != 0:
            audit_logger.error(f"SI_UPLOAD_FILE | SDA_UPLOAD_FAIL | file={file_path} | error={result.stderr}")
            return jsonify({"error": f"sda-cli upload failed: {result.stderr}"}), 502

    finally:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
            if temp_config and os.path.exists(temp_config_path):
                os.remove(temp_config_path)
        except Exception as e:
            audit_logger.warning(f"SI_UPLOAD_FILE | TMP_CLEANUP_FAIL | path={file_path} or {temp_config_path} | err={e}")

    # Update project DB as before
    project = projectDB.find_one({"_id": ObjectId(project_id)})
    if not project:
        audit_logger.warning(f"SI_UPLOAD_FILE | PROJECT_NOT_FOUND | user_id={current_user} | project_id={project_id} | IP={user_ip}")
        return jsonify({"error": "Project not found"}), 404
    
    projectDB.update_one(
        {"_id": ObjectId(project_id)},
        {"$push": {"files": {
            "file_id": file_id_str
        }}}
    )

    audit_logger.info(f"SI_UPLOAD_FILE | FILE_SAVED_LOCALLY | user_id={current_user} | filename={filename} | IP={user_ip}")

    return jsonify({
        "message": "File uploaded successfully via sda-cli",
        "file_id": file_id_str
    }), 200

# Download c4gh.pub.pem file
@si_bp.route('/crypto/public-key/download', methods=['POST'])
def download_c4gh_pub():
    user_ip = request.remote_addr
    current_user = util.get_user_id(request.cookies.get('id_token')) if hasattr(util, "get_user_id") else "unknown"

    audit_logger.info(f"SI_DOWNLOAD_PUB_KEY | user_id={current_user} | IP={user_ip}")

    resp = make_response(send_file(PUBLIC_KEY_PATH, mimetype="text/plain", as_attachment=True, download_name="TRE.pub"))
    resp.headers["Cache-Control"] = "public, max-age=86400"
    return resp


@si_bp.route("/crypto/public-key-checksum")
def download_checksum():
    user_ip = request.remote_addr
    current_user = util.get_user_id(request.cookies.get('id_token')) if hasattr(util, "get_user_id") else "unknown"

    audit_logger.info(f"SI_DOWNLOAD_PUB_KEY_CHECKSUM | user_id={current_user} | IP={user_ip}")

    with open(CHECKSUM_PATH, "r", encoding="utf-8") as f:
        text = f.read()    

    resp = make_response(text)
    resp.mimetype = "text/plain"
    resp.headers["Cache-Control"] = "public, max-age=86400"
    return resp

@si_bp.route("/files/list", methods=["POST"])
def list_uploaded_files():
    """
    Get the names and upload times of all files uploaded.
    """
    user_ip = request.remote_addr
    access_token = request.cookies.get('access_token')
    project_id = request.form.get('project_id')

    audit_logger.info(f"SI_LIST_UPLOADED_FILES | REQUEST_RECEIVED | IP={user_ip}")

    # Decode the JWT to get the current user
    try:
        passport = jwt.decode(access_token, options={"verify_signature": False})
        current_user = passport.get('sub', 'unknown')
        audit_logger.info(f"SI_LIST_UPLOADED_FILES | JWT_DECODED | user_id={current_user} | IP={user_ip}")
    except Exception as e:
        audit_logger.error(f"SI_LIST_UPLOADED_FILES | INVALID_JWT | IP={user_ip} | error={str(e)}")
        return jsonify({"error": f"Invalid access token: {str(e)}"}), 401
    
    if not project_id:
        audit_logger.warning(f"SI_LIST_UPLOADED_FILES | PROJECT_ID_MISSING | user_id={current_user} | IP={user_ip}")
        return jsonify({"error": "Project ID is required"}), 400

    # Find all files for the given project ID
    files = list(filesDB.find({"project_id": project_id, "user": current_user}))
    audit_logger.info(f"SI_LIST_UPLOADED_FILES | FILES_FOUND | user_id={current_user} | project_id={project_id} | IP={user_ip} | files_count={len(files)}")
    result = []
    for f in files:
        result.append({
            "file_id": str(f["_id"]),
            "filename": f.get("filename", ""),
            "user": f.get("user", ""),
            "upload_time": f.get("upload_time", "")
        })

    audit_logger.info(f"SI_LIST_UPLOADED_FILES | SUCCESS | user_id={current_user} | project_id={project_id} | IP={user_ip}")
    return jsonify({"files": result}), 200