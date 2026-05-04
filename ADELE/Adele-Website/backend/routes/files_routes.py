from datetime import datetime
import shutil
from fastapi import File
import utils
from flask import Blueprint, request, jsonify, send_file
import requests
from config.settings import *
import utils.fdp_utils
from pymongo import MongoClient
import logging
import os
from bson import ObjectId

legal_docs_bp = Blueprint('files', __name__)

client = MongoClient(MONGO_URI)
dbProject = client["project"]
projectDB = dbProject["project_details"]

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
SHARED_BASE_DIR = os.path.abspath(os.path.join(PROJECT_ROOT, "..", "..", "..", "tre-shared-documents"))
TEMPLATE_DIR = os.path.join(SHARED_BASE_DIR, "templates")
SIGNED_DIR = os.path.join(SHARED_BASE_DIR, "legal-documents")

# === Audit Logger Setup (reuse the same file as server.py) ===
AUDIT_LOG_FILE = os.path.join(os.path.dirname(__file__), '..', 'audit.log')
audit_logger = logging.getLogger("TRE-BIODATA-AUDIT")
if not audit_logger.hasHandlers():
    audit_logger.setLevel(logging.INFO)
    audit_handler = logging.FileHandler(AUDIT_LOG_FILE, encoding='utf-8')
    audit_handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s'))
    audit_logger.addHandler(audit_handler)


def get_timestamp():
    return datetime.now().strftime("%Y%m%d_%H%M%S")

# === ENDPOINTS ===

#download legal documents
@legal_docs_bp.route("/download/template/<string:project_id>/<string:filename>", methods=["GET"])
def downloadLegalDocuments(project_id, filename):

    print (f"[DEBUG] Downloading legal document: {filename} for project ID: {project_id}")

    project = projectDB.find_one({"_id": ObjectId(project_id)})
    if not project:
        print(f"[DEBUG] Project not found: {project_id}")
        return jsonify({"error": "Project not found"}), 404
    if not project.get("templateFiles"):
        print(f"[DEBUG] No legal documents found for project: {project_id}")
        return jsonify({"error": "No legal documents found for this project"}), 404
    # Check if the filename exists in the project's templateFiles filenames list
    for file in project["templateFiles"]:
        if file["filename"] == filename:
            print(f"[DEBUG] Found file in project legal documents: {filename}")
            break
    else:
        print(f"[DEBUG] File not found in project legal documents: {filename}")
        return jsonify({"error": "File not found in project legal documents"}), 404

    file_path = os.path.join(TEMPLATE_DIR, filename)
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    return send_file(file_path)

@legal_docs_bp.route("/download/signed/<string:project_id>/<string:filename>", methods=["GET"])
def downloadSignedDocuments(project_id, filename):

    print (f"[DEBUG] Downloading signed document: {filename} for project ID: {project_id}")

    project = projectDB.find_one({"_id": ObjectId(project_id)})
    if not project:
        print(f"[DEBUG] Project not found: {project_id}")
        return jsonify({"error": "Project not found"}), 404
    if not project.get("userSignedFiles"):
        print(f"[DEBUG] No signed documents found for project: {project_id}")
        return jsonify({"error": "No signed documents found for this project"}), 404
    # Check if the filename exists in the project's userSignedFiles filenames list
    for file in project["userSignedFiles"]:
        if file["filename"] == filename:
            print(f"[DEBUG] Found file in project signed documents: {filename}")
            break
    else:
        print(f"[DEBUG] File not found in project legal documents: {filename}")
        return jsonify({"error": "File not found in project legal documents"}), 404

    file_path = os.path.join(SIGNED_DIR, project_id, filename)
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    return send_file(file_path)


@legal_docs_bp.post("/upload-signed/<string:project_id>")
def upload_signed(project_id: str):

    if "file" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400
    
    file = request.files["file"]

    project = projectDB.find_one({"_id": ObjectId(project_id)})

    if not project:
        print(f"[DEBUG] Project not found: {project_id}")
        return jsonify({"error": "Project not found"}), 404
    if not project.get("templateFiles"):
        print(f"[DEBUG] No legal documents found for project: {project_id}")
        return jsonify({"error": "No legal documents found for this project"}), 404
    # Check if the filename exists in the project's templateFiles filenames list

    # remove the extension of the file
    if file.filename.endswith('.pdf'):
        file.filename = file.filename[:-4]
    else:
        return jsonify({"error": "Only PDF files are allowed."}), 400
            
    timestamp = get_timestamp()
    filename = f"{file.filename}_{project_id}_{timestamp}.pdf"
    project_folder = os.path.join(SIGNED_DIR, project_id)
    os.makedirs(project_folder, exist_ok=True)
    file_path = os.path.join(project_folder, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file, buffer)

    file_doc = {
        "filename": filename,
        "path": file_path,
        "verified": False,
        "feedback": None
    }

    projectDB.update_one(
        {"_id": ObjectId(project_id)},
        {
            "$push": {"userSignedFiles": file_doc},
            "$set": {"status": "A-AR"}
        }
    )

    return {"status": "uploaded", "file": filename}


