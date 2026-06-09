from flask import Blueprint, request, jsonify, session
from minio import Minio
import requests
from pymongo import MongoClient
from config.settings import * 
from minio.commonconfig import CopySource
from routes.tasks_management import updateTaskStatus
from config.audit_logger import audit_logger
import os
import time
from bson import ObjectId

si_management_bp = Blueprint('si_management', __name__)

# The SDA ingestion pipeline is asynchronous: each stage (ingest -> verify ->
# accession -> finalize) consumes a RabbitMQ message and produces the next one
# only after a worker has processed it. The next sda-admin command can only act
# once its input queue is populated, so we poll the relevant list endpoint
# until the file shows up before triggering the following stage.
SDA_STAGE_TIMEOUT = 240   # seconds to wait for a file to reach the next stage
SDA_STAGE_INTERVAL = 4    # seconds between polls


def _wait_for_file_in_queue(list_endpoint, filename, owner_key):
    """Poll an SDA list endpoint until `filename` appears in its queue."""
    deadline = time.time() + SDA_STAGE_TIMEOUT
    while time.time() < deadline:
        try:
            resp = requests.post(SI_API_URI + list_endpoint,
                                 json={"user": owner_key}, timeout=20)
            if resp.ok:
                files = resp.json().get("files", []) or []
                if any(filename == f or filename in f for f in files):
                    return True
        except (requests.RequestException, ValueError):
            pass
        time.sleep(SDA_STAGE_INTERVAL)
    return False

# Initialize MinIO client
minio_client = Minio(
    MINIO_ENDPOINT, 
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False # Change to TRUE if HTTPS is required
) 

client = MongoClient(MONGO_URI)
dbProject = client["project"]
projectDB = dbProject["project_details"]

filesDB = dbProject["files"]

dbUser = client["users"]
tasksDB = dbUser["tasks"]

TES_BUCKET = "tes"
RESULTS_BUCKET = "results"

# Task pipeline outputs land in TES_BUCKET; approved outputs are moved to
# RESULTS_BUCKET. These buckets are ADELE-specific and not provisioned by the
# SDA storage init, so ensure they exist (idempotent) at startup.
for _bucket in (TES_BUCKET, RESULTS_BUCKET):
    try:
        if not minio_client.bucket_exists(_bucket):
            minio_client.make_bucket(_bucket)
            print(f"[INFO] Created MinIO bucket '{_bucket}'")
    except Exception as e:
        print(f"[WARN] Could not ensure MinIO bucket '{_bucket}': {e}")

@si_management_bp.route('/get/output/list', methods=['GET'])
def get_output_list():
    user_id = session.get('user_id', 'unknown')
    username = session.get('username', 'unknown')
    try:
        print("[DEBUG] Listing objects in TES_BUCKET...")
        files = []
        objects = minio_client.list_objects(TES_BUCKET, recursive=True)
        for obj in objects:
            print(f"[DEBUG] Found object: {obj.object_name}")
            files.append(obj.object_name)
        print(f"[DEBUG] Total files found in {TES_BUCKET} bucket: {len(files)}")
        audit_logger.info(f"GET_OUTPUT_LIST | SUCCESS | user_id={user_id} | username={username} | IP={request.remote_addr} | files={len(files)}")
        return jsonify({"files": files}), 200
    except Exception as e:
        print(f"[ERROR] Exception in get_output_list: {e}")
        audit_logger.warning(f"GET_OUTPUT_LIST | ERROR | user_id={user_id} | username={username} | IP={request.remote_addr} | error={str(e)}")
        return jsonify({"error": str(e)}), 500
    
@si_management_bp.route('/view/<user>/<filename>', methods=['GET'])
def view_user_filename(user, filename):
    user_id = session.get('user_id', 'unknown')
    username = session.get('username', 'unknown')
    try:
        object_path = f"{user}/{filename}"
        response = minio_client.get_object(TES_BUCKET, object_path)
        data = response.read().decode("utf-8")
        response.close()
        response.release_conn()
        audit_logger.info(f"VIEW_FILE | SUCCESS | user_id={user_id} | username={username} | IP={request.remote_addr} | file={object_path}")
        return jsonify({"content": data}), 200
    except Exception as e:
        audit_logger.warning(f"VIEW_FILE | ERROR | user_id={user_id} | username={username} | IP={request.remote_addr} | file={object_path} | error={str(e)}")
        return jsonify({"error": str(e)}), 500
    
@si_management_bp.route('/approve/<user>/<filename>', methods=['POST'])
def approve_file(user, filename):
    user_id = session.get('user_id', 'unknown')
    username = session.get('username', 'unknown')
    try:
        source = CopySource(
            bucket_name=TES_BUCKET,
            object_name=f"{user}/{filename}"
        )
        dest_path = f"{user}/{filename}"
        minio_client.copy_object(
            RESULTS_BUCKET,
            dest_path,
            source
        )
        minio_client.remove_object(TES_BUCKET, f"{user}/{filename}")
        print(f"[DEBUG] File {filename} approved and moved to {RESULTS_BUCKET}/{dest_path}")
        # The output object is named "<user>/<file_id>"; mark the matching
        # task COMPLETED so the user can view the result on the website.
        result = tasksDB.update_one(
            {"user_id": user, "file_id": filename},
            {"$set": {"status": "COMPLETED"}}
        )
        audit_logger.info(f"APPROVE_FILE | SUCCESS | user_id={user_id} | username={username} | IP={request.remote_addr} | file={dest_path} | tasks_updated={result.modified_count}")
        return jsonify({"message": "File approved and moved successfully."}), 200
    except Exception as e:
        audit_logger.warning(f"APPROVE_FILE | ERROR | user_id={user_id} | username={username} | IP={request.remote_addr} | file={filename} | error={str(e)}")
        return jsonify({"error": str(e)}), 500

@si_management_bp.route('/reject/<user>/<filename>', methods=['POST'])
def reject_file(user, filename):
    user_id = session.get('user_id', 'unknown')
    username = session.get('username', 'unknown')
    try:
        object_path = f"{user}/{filename}"
        minio_client.remove_object(TES_BUCKET, object_path)
        tasksDB.update_one(
            {"user_id": user, "file_id": filename},
            {"$set": {"status": "REJECTED"}}
        )
        audit_logger.info(f"REJECT_FILE | SUCCESS | user_id={user_id} | username={username} | IP={request.remote_addr} | file={object_path}")
        return jsonify({"message": "File rejected and deleted successfully."}), 200
    except Exception as e:
        audit_logger.warning(f"REJECT_FILE | ERROR | user_id={user_id} | username={username} | IP={request.remote_addr} | file={object_path} | error={str(e)}")
        return jsonify({"error": str(e)}), 500

def update_rems(dataset_id, rems_item_name):
    """
    Create a REMS resource and catalogue item for the given dataset.
    Returns True if successful, False otherwise.
    """
    payload = {
        "resid": dataset_id,
        "organization": {
            "organization/id": "adele-tre"
        },
        "licenses": [1]
    }

    headers = {
        'Content-Type': 'application/json',
        'x-rems-user-id': REMS_USER_ID,
        'x-rems-api-key': REMS_API_KEY
    }

    try:
        # REMS access is granted per dataset, and a resource's resid is unique.
        # Every file in a dataset shares the same dataset_id, so the second and
        # third file would fail the resid UNIQUE constraint. If a resource for
        # this dataset already exists, it (and its catalogue item) already
        # covers every file in the dataset, so there is nothing more to do.
        existing = requests.get(REMS_API + "/resources", headers=headers)
        if existing.ok:
            for res in existing.json():
                if res.get("resid") == dataset_id:
                    print(f"[DEBUG] REMS resource for dataset {dataset_id} already exists; reusing it")
                    return True

        response = requests.post(REMS_API + "/resources/create", json=payload, headers=headers)
        print(f"[DEBUG] REMS API response: {response.status_code} - {response.text}")
        if response.ok and response.json().get("success", False):
            resource_id = response.json().get('id')
            print (f"[DEBUG] Created REMS resource with ID: {resource_id}")
            payload = {
                "resid": resource_id,
                "wfid": 1,
                "organization": {
                    "organization/id": "adele-tre"
                },
                "localizations": {
                    "en": {
                        "title": rems_item_name,
                    }
                },
                "enabled": True,
                "archived": False
            }
            response = requests.post(REMS_API + "/catalogue-items/create", json=payload, headers=headers)
            print(f"[DEBUG] REMS Catalogue API response: {response.status_code} - {response.text}")
            if response.ok and response.json().get("success", False):
                return True
            else:
                print("Failed to add file to REMS resource:", response.text)
                return False
        else:
            print("Failed to create REMS resource:", response.text)
            return False
    except Exception as e:
        print(f"[ERROR] Exception in update_rems: {e}")
        return False

@si_management_bp.route('/get-queue-files', methods=['GET'])
def get_queue_files():
    """
    Get the list of files in the SI ingest queue.
    """

    try:
        response = requests.post(SI_API_URI + "/ingest/list")
        print(f"[DEBUG] SI API response: {response.status_code} - {response.text}")
        return jsonify(response.json()), response.status_code
    except Exception as e:
        print(f"[ERROR] Failed to get queue files: {e}")
        return jsonify({"error": str(e)}), 500

@si_management_bp.route('/ingest', methods=['POST'])
def ingest_file():
    """
    Process a file from the SI queue.
    """
    user_id = session.get('user_id', 'unknown')
    username = session.get('username', 'unknown')
    print("[DEBUG] Ingesting file. Request data:", request.form)
    audit_logger.info(f"INGEST_FILE | REQUEST_RECEIVED | user_id={user_id} | username={username} | IP={request.remote_addr} | data={request.form}")
    try:
        filename = request.form.get('filename')
        if not filename:
            audit_logger.warning(f"INGEST_FILE | FILENAME_MISSING | user_id={user_id} | username={username} | IP={request.remote_addr}")
            return jsonify({"error": "File name is required"}), 400

        unique_id = request.form.get('unique_id')
        if not unique_id:
            audit_logger.warning(f"INGEST_FILE | UNIQUE_ID_MISSING | user_id={user_id} | username={username} | IP={request.remote_addr}")
            return jsonify({"error": "Unique ID is required"}), 400

        dataset_id = request.form.get('dataset_id')
        if not dataset_id:
            audit_logger.warning(f"INGEST_FILE | DATASET_ID_MISSING | user_id={user_id} | username={username} | IP={request.remote_addr}")
            return jsonify({"error": "Dataset ID is required"}), 400

        # The "REMS Catalogue ID" field from the ingest form is used as the
        # human-readable title of the REMS catalogue item (what applicants see
        # when browsing the catalogue). The resource's resid stays the dataset
        # id, since that is the identifier the access-control chain relies on.
        rems_item_name = (request.form.get('rems_catalogue_id')
                          or request.form.get('rems_item_name')
                          or filename)
        if not rems_item_name:
            audit_logger.warning(f"INGEST_FILE | REMS_ITEM_NAME_MISSING | user_id={user_id} | username={username} | IP={request.remote_addr}")
            return jsonify({"error": "REMS item name is required"}), 400

        # Determine the S3 access key of the file owner so sda-admin filters
        # inbox/verified/completed queues against the right bucket path.
        # Filenames are "<mongo_file_id>.c4gh"; the owner is recorded in filesDB.
        file_owner_key = None
        file_doc = None
        try:
            mongo_file_id = filename[:-len(".c4gh")] if filename.endswith(".c4gh") else filename
            file_doc = filesDB.find_one({"_id": ObjectId(mongo_file_id)})
            if file_doc and file_doc.get("user"):
                file_owner_key = file_doc["user"].replace("@", "_")
        except Exception as e:
            audit_logger.warning(f"INGEST_FILE | FILE_OWNER_LOOKUP_FAIL | filename={filename} | error={str(e)}")
        if not file_owner_key:
            audit_logger.warning(f"INGEST_FILE | FILE_OWNER_UNKNOWN | filename={filename}")
            return jsonify({"error": "Could not determine file owner for ingest"}), 400

        # A file can only be ingested once: the SDA pipeline consumes the inbox
        # message, so re-ingesting would just hang waiting on empty queues.
        if file_doc.get("ingested"):
            audit_logger.warning(f"INGEST_FILE | ALREADY_INGESTED | user_id={user_id} | filename={filename}")
            return jsonify({"error": "This file has already been ingested."}), 409

        # The upload form gives every file in a project the same unique_id, but
        # the accession id must be unique (UNIQUE constraint on sda.files).
        # Append the file id so each file in a project accessions cleanly.
        unique_id = f"{unique_id}:{mongo_file_id}"

        # Each file injection must be its own REMS entry. The upload form gives
        # every file in a project the same dataset_id; appending the file id
        # makes each file its own SDA dataset, which in turn becomes its own
        # REMS resource + catalogue item (resid is UNIQUE in REMS).
        dataset_id = f"{dataset_id}:{mongo_file_id}"

        sda_payload_base = {"file_name": filename, "user": file_owner_key}

        # Ingest file
        response = requests.post(SI_API_URI + "/ingest", json=sda_payload_base)
        print(f"[DEBUG] SI API response to Ingest: {response.status_code} - {response.text}")
        audit_logger.info(f"INGEST_FILE | INGEST_API_CALLED | user_id={user_id} | username={username} | IP={request.remote_addr} | filename={filename} | status={response.status_code}")
        if response.status_code != 200:
            audit_logger.warning(f"INGEST_FILE | INGEST_API_FAILED | user_id={user_id} | username={username} | IP={request.remote_addr} | filename={filename} | status={response.status_code} | error={response.text}")
            return jsonify({"error": "Failed to ingest file"}), response.status_code

        # Wait until the ingest pipeline has verified the file (it then appears
        # in the "verified" queue, which the accession step consumes from).
        if not _wait_for_file_in_queue("/accession/list", filename, file_owner_key):
            audit_logger.warning(f"INGEST_FILE | VERIFY_TIMEOUT | user_id={user_id} | username={username} | IP={request.remote_addr} | filename={filename}")
            return jsonify({"error": "Timed out waiting for file to be verified by the SDA pipeline"}), 504

        # Accession file
        response = requests.post(SI_API_URI + "/accession/", json={**sda_payload_base, "unique_id": unique_id})
        print(f"[DEBUG] SI API response to Accession: {response.status_code} - {response.text}")
        audit_logger.info(f"INGEST_FILE | ACCESSION_API_CALLED | user_id={user_id} | username={username} | IP={request.remote_addr} | filename={filename} | unique_id={unique_id} | status={response.status_code}")
        if response.status_code != 200:
            audit_logger.warning(f"INGEST_FILE | ACCESSION_API_FAILED | user_id={user_id} | username={username} | IP={request.remote_addr} | filename={filename} | unique_id={unique_id} | status={response.status_code} | error={response.text}")
            return jsonify({"error": "Failed to accession file"}), response.status_code

        # Wait until the file has been finalized (it then appears in the
        # "completed" queue, which the dataset-mapping step consumes from).
        if not _wait_for_file_in_queue("/dataset/list", filename, file_owner_key):
            audit_logger.warning(f"INGEST_FILE | FINALIZE_TIMEOUT | user_id={user_id} | username={username} | IP={request.remote_addr} | filename={filename}")
            return jsonify({"error": "Timed out waiting for file to be accessioned by the SDA pipeline"}), 504

        # Create dataset
        response = requests.post(SI_API_URI + "/dataset/", json={**sda_payload_base, "dataset_id": dataset_id})
        print(f"[DEBUG] SI API response to Create Dataset: {response.status_code} - {response.text}")
        audit_logger.info(f"INGEST_FILE | DATASET_API_CALLED | user_id={user_id} | username={username} | IP={request.remote_addr} | filename={filename} | dataset_id={dataset_id} | status={response.status_code}")
        if response.status_code != 200:
            audit_logger.warning(f"INGEST_FILE | DATASET_API_FAILED | user_id={user_id} | username={username} | IP={request.remote_addr} | filename={filename} | dataset_id={dataset_id} | status={response.status_code} | error={response.text}")
            return jsonify({"error": "Failed to create dataset"}), response.status_code

        # Update REMS
        rems_success = update_rems(dataset_id, rems_item_name)
        audit_logger.info(f"INGEST_FILE | REMS_UPDATE_ATTEMPT | user_id={user_id} | username={username} | IP={request.remote_addr} | dataset_id={dataset_id} | rems_item_name={rems_item_name} | success={rems_success}")
        if not rems_success:
            audit_logger.warning(f"INGEST_FILE | REMS_UPDATE_FAILED | user_id={user_id} | username={username} | IP={request.remote_addr} | dataset_id={dataset_id} | rems_item_name={rems_item_name}")
            return jsonify({"error": "Failed to update REMS resource"}), 500

        filesDB.update_one({"_id": ObjectId(mongo_file_id)}, {"$set": {"ingested": True}})
        audit_logger.info(f"INGEST_FILE | SUCCESS | user_id={user_id} | username={username} | IP={request.remote_addr} | filename={filename} | dataset_id={dataset_id}")
        return jsonify({"message": "File processed successfully"}), 200

    except Exception as e:
        print(f"[ERROR] Exception in process_file: {e}")
        audit_logger.error(f"INGEST_FILE | EXCEPTION | user_id={user_id} | username={username} | IP={request.remote_addr} | error={str(e)}")
        return jsonify({"error": str(e)}), 500


@si_management_bp.route('/get/files', methods=['GET'])
def get_file():
    user_id = session.get('user_id', 'unknown')
    username = session.get('username', 'unknown')
    
    #Temporary implementation to return a static list of files
    PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
    SHARED_BASE_DIR = os.path.abspath(os.path.join(PROJECT_ROOT, "..", "..", "..", "tre-shared-documents"))
    TEMP_DIR = os.path.join(SHARED_BASE_DIR, "tmp")

    try:
        print("[DEBUG] Listing files in temporary directory:", TEMP_DIR)
        files = []
        for root, dirs, filenames in os.walk(TEMP_DIR):
            for filename in filenames:
                file_path = os.path.join(root, filename)
                relative_path = os.path.relpath(file_path, TEMP_DIR)
                files.append(relative_path)
        print(f"[DEBUG] Total files found: {len(files)}")
        audit_logger.info(f"GET_FILES | SUCCESS | user_id={user_id} | username={username} | IP={request.remote_addr} | files={len(files)}")
        return jsonify({"output": files}), 200
    except Exception as e:
        print(f"[ERROR] Exception in get_file: {e}")
        audit_logger.warning(f"GET_FILES | ERROR | user_id={user_id} | username={username} | IP={request.remote_addr} | error={str(e)}")
        return jsonify({"error": str(e)}), 500

    
@si_management_bp.route("/files/list", methods=["POST"])
def list_uploaded_files():
    """
    Get the names and upload times of all files uploaded.
    """
    user_id = session.get('user_id', 'unknown')
    username = session.get('username', 'unknown')

    project_id = request.form.get('project_id')

    audit_logger.info(f"SI_LIST_UPLOADED_FILES | REQUEST_RECEIVED | IP={user_id}")

    if not project_id:
        audit_logger.warning(f"SI_LIST_UPLOADED_FILES | PROJECT_ID_MISSING | user_id={user_id} | IP={request.remote_addr}")
        return jsonify({"error": "Project ID is required"}), 400

    # Find all files for the given project ID
    files = list(filesDB.find({"project_id": project_id}))
    audit_logger.info(f"SI_LIST_UPLOADED_FILES | FILES_FOUND | user_id={user_id} | project_id={project_id} | IP={request.remote_addr} | files_count={len(files)}")
    result = []
    for f in files:
        result.append({
            "file_id": str(f["_id"]),
            "filename": f.get("filename", ""),
            "user": f.get("user", ""),
            "upload_time": f.get("upload_time", "")
        })

    audit_logger.info(f"SI_LIST_UPLOADED_FILES | SUCCESS | user_id={user_id} | project_id={project_id} | IP={request.remote_addr}")
    return jsonify({"files": result}), 200

@si_management_bp.route('/get/file/<filename>', methods=['GET'])
def get_single_file(filename):
    """
    Return a single file's content from its name in the temporary directory.
    """
    user_id = session.get('user_id', 'unknown')
    username = session.get('username', 'unknown')

    PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
    SHARED_BASE_DIR = os.path.abspath(os.path.join(PROJECT_ROOT, "..", "..", "..", "tre-shared-documents"))
    TEMP_DIR = os.path.join(SHARED_BASE_DIR, "tmp")
    file_path = os.path.join(TEMP_DIR, filename)

    try:
        print(f"[DEBUG] Fetching file: {file_path}")
        if not os.path.isfile(file_path):
            audit_logger.warning(f"GET_SINGLE_FILE | FILE_NOT_FOUND | user_id={user_id} | username={username} | IP={request.remote_addr} | filename={filename}")
            return jsonify({"error": "File not found"}), 404

        with open(file_path, "rb") as f:
            content = f.read()
        audit_logger.info(f"GET_SINGLE_FILE | SUCCESS | user_id={user_id} | username={username} | IP={request.remote_addr} | filename={filename}")
        return content, 200, {'Content-Type': 'application/octet-stream'}
    except Exception as e:
        print(f"[ERROR] Exception in get_single_file: {e}")
        audit_logger.warning(f"GET_SINGLE_FILE | ERROR | user_id={user_id} | username={username} | IP={request.remote_addr} | filename={filename} | error={str(e)}")
        return jsonify({"error": str(e)}), 500

@si_management_bp.route('/update/file/status', methods=['POST'])
def update_file_status():
    """
    Update the status of a file.
    """
    user_id = session.get('user_id', 'unknown')
    username = session.get('username', 'unknown')

    file_id = request.form.get('file_id')

    audit_logger.info(f"SI_UPDATE_FILE_STATUS | REQUEST_RECEIVED | IP={request.remote_addr}")

    if not file_id:
        audit_logger.warning(f"SI_UPDATE_FILE_STATUS | FILE_ID_MISSING | user_id={user_id} | IP={request.remote_addr}")
        return jsonify({"error": "File ID is required"}), 400

    # Update the file status in the database
    result = filesDB.update_one({"_id": ObjectId(file_id)}, {"$set": {"archived": True}})
    if result.modified_count == 0:
        audit_logger.warning(f"SI_UPDATE_FILE_STATUS | FILE_NOT_FOUND | user_id={user_id} | file_id={file_id} | IP={request.remote_addr}")
        return jsonify({"error": "File not found"}), 404

    audit_logger.info(f"SI_UPDATE_FILE_STATUS | SUCCESS | user_id={user_id} | file_id={file_id} | IP={request.remote_addr}")
    return jsonify({"success": True}), 200
