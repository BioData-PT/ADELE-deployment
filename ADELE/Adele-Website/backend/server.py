import datetime
import io
import logging
from bson import ObjectId
from flask import Flask, json, request, redirect, jsonify, make_response, send_file
import requests
import jwt
from flask_cors import CORS
from pymongo import MongoClient
from minio import Minio
from config.settings import *
from pathlib import Path
import json
from rdflib import Graph
import os

from routes.fdp_routes import fdp_bp
from routes.si_routes import si_bp
from routes.files_routes import legal_docs_bp
import xml.etree.ElementTree as ET
from utils import util

# =========================
# Logging Configuration
# =========================
AUDIT_LOG_FILE = os.path.join(os.path.dirname(__file__), 'audit.log')
audit_logger = logging.getLogger("TRE-BIODATA-AUDIT")
audit_logger.setLevel(logging.INFO)
audit_handler = logging.FileHandler(AUDIT_LOG_FILE, encoding='utf-8')
audit_handler.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s'))
audit_logger.addHandler(audit_handler)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

client = MongoClient(MONGO_URI)
dbMetadata = client["metadata"]
catalogDB = dbMetadata["catalog"]
datasetDB = dbMetadata["dataset"]
distributionDB = dbMetadata["distribution"]

dbProject = client["project"]
projectDB = dbProject["project_details"]

templateDB = dbProject["templates"]

dbUser = client["users"]
userDB = dbUser["users_info"]

tasksDB = dbUser["tasks"]

dbPipeline = client["pipeline"]
pipelineDB = dbPipeline["pipeline_details"] #Pipeline_id | PayloadJson
id_token = None
access_token = None
token_type = None
user = None

app.register_blueprint(fdp_bp, url_prefix='/fdp')  # Optional prefix
app.register_blueprint(si_bp, url_prefix='/si')  
app.register_blueprint(legal_docs_bp, url_prefix='/files')

## Health Check
@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy"}), 200

## Authentication and Authorization ##
@app.route('/login')
def login():
    """Redirect user to the OAuth login page"""
    login_uri = f"{LOGIN_URI}?response_type=code&client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&scope=openid%20profile%20email%20ga4gh_passport_v1"
    audit_logger.info(f"LOGIN | IP={request.remote_addr}")
    return redirect(login_uri)

@app.route('/oidc-callback')
def oidc_callback():
    global id_token, access_token, token_type

    code = request.args.get('code')
    audit_logger.info(f"OIDC_CALLBACK | IP={request.remote_addr} | code={code}")
    if not code:
        audit_logger.warning(f"OIDC_CALLBACK | MISSING_CODE | IP={request.remote_addr}")
        return jsonify({"error": "Authorization code missing"}), 400

    token_request_data = {
        "code": code,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "scope": "openid profile email ga4gh_passport_v1",
        "redirect_uri": REDIRECT_URI,
        "requested_token_type": "urn:ietf:params:oauth:token-type:refresh_token",
        "grant_type": "authorization_code"
    }

    headers = {'Content-Type': 'application/x-www-form-urlencoded'}
    
    response = requests.post(AUTHORIZATION_URI, data=token_request_data, headers=headers)

    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch tokens"}), response.status_code

    token_data = response.json()
    print("Token Response:", token_data)

    id_token = token_data.get("id_token")
    token_type = token_data.get("token_type")
    access_token = token_data.get("access_token")

    # Store token in cookies
    resp = make_response(redirect(WEBSITE_FRONTEND_URL_PUBLIC))
    resp.set_cookie('id_token', id_token, httponly=False, secure=True, samesite='None')
    resp.set_cookie('access_token', access_token, httponly=False, secure=True, samesite='None')
    resp.set_cookie('token_type', token_type, httponly=False, secure=True, samesite='None')

    print("Redirecting user to frontend")
    print("Cookies:", resp.headers)
    print (resp)

    audit_logger.info(f"OIDC_CALLBACK | SUCCESS | IP={request.remote_addr}")
    return resp


@app.route('/api/user')
def get_user():
    """Return user data separately"""
    access_token = request.cookies.get('access_token')
    token_type = request.cookies.get('token_type')
    user_id = None

    if not access_token or not token_type:
        audit_logger.warning(f"API_USER | UNAUTHORIZED | IP={request.remote_addr}")
        return jsonify({"error": "Unauthorized"}), 401

    # Fetch user info
    response = requests.post(USER_INFO_URI, headers={'Authorization': f"{token_type} {access_token}"})

    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch user info"}), response.status_code
    
    print(response.json())
    
    # save user data in the database as user.sub -> user.info
    user = {
        "id": response.json().get("sub"),
        "user_info": response.json()
    }

    if not userDB.find_one({"id": user.get("id")}):
        userDB.insert_one(user)

    user_json = response.json()
    user_id = user_json.get("sub", "unknown")
    audit_logger.info(f"API_USER | user_id={user_id} | IP={request.remote_addr}")

    return user_json


@app.route('/catalogs', methods=['GET'])
def get_catalogs():
    # TODO: Add user authentication
    """Return all catalogs"""
    data = list(catalogDB.find({}, {"_id": 0}))  # Fetch data from MongoDB
    json_data = json.dumps(data, default=str)
    print('Catalogs:', json_data)
    return jsonify(json_data), 200

@app.route('/catalog/<string:catalog_id>/datasets', methods=['GET'])
def get_datasets_by_catalog(catalog_id):
    datasets = list(datasetDB.find({"isPartOf": catalog_id}, {"_id": 0}))
    json_data = json.dumps(datasets, default=str)
    print('Datasets from catalog ', catalog_id, ' :', json_data)
    return jsonify(json_data), 200

@app.route('/datasets', methods=['GET'])
def get_datasets():
    #TODO: Add user authentication
    """Return all datasets"""
    datasets = list(datasetDB.find({}, {"_id": 0}))
    json_data = json.dumps(datasets, default=str)
    print('Datasets:', json_data)
    return jsonify(json_data), 200

@app.route('/dataset/<string:dataset_id>/distributions', methods=['GET'])
def get_distributions_by_dataset(dataset_id):
    distributions = list(distributionDB.find({"isPartOf": dataset_id}, {"_id": 0}))
    json_data = json.dumps(distributions, default=str)
    print('Distributions from Dataset ', dataset_id, ' :', json_data)
    return jsonify(json_data), 200


@app.route('/distributions', methods=['GET'])
def get_distributions():
    #TODO: Add user authentication
    """Return all distributions"""
    distributions = list(distributionDB.find({}, {"_id": 0}))
    json_data = json.dumps(distributions, default=str)
    print('Distributions:', json_data)
    return jsonify(json_data), 200



@app.route('/catalog/<string:catalog_id>', methods=['GET'])
def get_catalog(catalog_id):
    #TODO: Add user authentication
    """Return a specific catalog"""
    catalog = catalogDB.find_one({"_id": catalog_id})
    return jsonify(catalog), 200

@app.route('/dataset/<string:dataset_id>', methods=['GET'])
def get_dataset(dataset_id):
    #TODO: Add user authentication
    """Return a specific dataset"""
    dataset = datasetDB.find_one({"_id": dataset_id})
    return jsonify(dataset), 200



## Project API ##
@app.route('/projects', methods=['GET'])
def get_projects():
    """Return all user's projects"""

    id_token = request.cookies.get('id_token')
    user_id = util.get_user_id(id_token)
    audit_logger.info(f"GET_PROJECTS | user_id={user_id} | IP={request.remote_addr}")
    if not user_id:
        audit_logger.warning(f"GET_PROJECTS | UNAUTHORIZED | IP={request.remote_addr}")
        return jsonify({"error": "Unauthorized"}), 401

    projects = [util.serialize_doc(p) for p in projectDB.find({'owner': user_id})]

    json_data = json.dumps(projects, default=str)
    return jsonify(json_data), 200


@app.route('/projects/<string:project_id>', methods=['GET'])
def get_project(project_id):
    """Return a specific project"""

    id_token = request.cookies.get('id_token')
    user_id = util.get_user_id(id_token)
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    project = projectDB.find_one({'owner': user_id, "_id": ObjectId(project_id)})

    if not project:
        return jsonify({"error": "Project not found"}), 404
    
    # Convert ObjectId to string
    project = util.serialize_doc(project)

    return jsonify(project), 200

@app.route('/submit-project', methods=['POST'])
def submit_project():
    """Submit project data to the server"""
    print("Request:", request)
    project_data = request.json

    if (not project_data):
        return jsonify({"error": "Project data missing"}), 400 
    
    project_id = project_data['id']
    del project_data['id']
    
    if not project_id:
        return jsonify({"error": "Project ID missing"}), 400
    
    if project_id == 'new':
        projectDB.insert_one(project_data)
        return jsonify({"message": "Project data submitted successfully"})
    
    else:
        projectDB.update_one({"_id": ObjectId(project_id)}, {"$set": project_data})
        return jsonify({"message": "Project data updated successfully"})
    


@app.route('/projects/<string:project_id>', methods=['PATCH'])
def update_project(project_id):
    """Update project data"""
    project_data = request.json

    if (not project_data):
        return jsonify({"error": "Project data missing"}), 400
    
    id_token = request.cookies.get('id_token')
    user_id = util.get_user_id(id_token)
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    ALLOWED_FIELDS = {"status", "last_update", "dataset_uri", "distributions_uri"} 

    # Filter out any fields that are not allowed
    project_data = {k: v for k, v in project_data.items() if k in ALLOWED_FIELDS}

    projectDB.update_one({"_id": ObjectId(project_id), "owner": user_id}, {"$set": project_data})
    return jsonify({"message": "Project updated successfully"})



@app.route('/pipelines', methods=['GET'])
def get_pipelines():

    raw_pipelines = list(pipelineDB.find({}, {"_id": 0}) )
    print('Pipelines:', raw_pipelines)

    pipelines = []
    for pipeline in raw_pipelines:
        print('Pipeline:', pipeline)
        payload = json.loads(pipeline.get('payload', '{}'))
        pipelines.append({
            "id": pipeline.get('id'),
            "name": payload.get('name'),
            "description": payload.get('description'),
        })

    print('Pipelines:', pipelines)

    return jsonify({"pipelines": pipelines}), 200

@app.route("/run-task", methods=['POST'])
def runTask():
    print (request.json)
    file_id = request.json['file_id']
    pipeline_id = request.json['pipeline_id']

    id_token = request.cookies.get('id_token')
    user_id = util.get_user_id(id_token)
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    print (file_id)
    print (pipeline_id)

    #get payload associated to the pipeline
    resp = pipelineDB.find_one({"id": pipeline_id}, {"_id": 0})
    if not resp:
        return jsonify({"error": "Pipeline not found"}), 404

    #get cookies to get the access token
    access_token = request.cookies.get('access_token')
    
    template = resp['payload']
    # Pipeline payloads are stored as JSON strings. Substitute the task-specific
    # values into the raw text, then parse to a dict for the TES request.
    payload_str = template if isinstance(template, str) else json.dumps(template)

    # Pipelines that consume the task's file declare $INPUT_S3_URL. The SDA
    # archive is crypt4gh-encrypted and Funnel cannot decrypt it (nor send a
    # Bearer token), so we fetch the decrypted file from the SDA download
    # server -- which holds the private key -- and stage it into plain S3 for
    # Funnel to mount into the execution container.
    input_s3_url = ""
    if "$INPUT_S3_URL" in payload_str:
        try:
            dl = requests.get(f"{DOWNLOAD_S3.rstrip('/')}/files/{file_id}",
                              headers={"Authorization": f"Bearer {access_token}"}, timeout=120)
            dl.raise_for_status()
        except requests.RequestException as e:
            return jsonify({"error": f"Failed to fetch file from archive: {str(e)}"}), 502
        content = dl.content
        minio_client = Minio(MINIO_ENDPOINT, access_key=MINIO_ACCESS_KEY,
                             secret_key=MINIO_SECRET_KEY, secure=False)
        if not minio_client.bucket_exists("taskinput"):
            minio_client.make_bucket("taskinput")
        minio_client.put_object("taskinput", file_id, io.BytesIO(content), length=len(content))
        input_s3_url = f"s3://taskinput/{file_id}"

    values = {
    "$USER_NAME": user_id,
    "$FILE_ID": file_id,
    "$PIPELINE_ID": pipeline_id,
    "$TOKEN": access_token,
    "$INPUT_S3_URL": input_s3_url
    }

    for key, value in values.items():
        payload_str = payload_str.replace(key, value or "")

    payload = json.loads(payload_str)

    response = requests.post(FUNNEL_URI, headers={"Accept": "application/json", "Content-Type": "application/json"}, json=payload)

    existing_task = tasksDB.find_one({
        "user_id": user_id,
        "pipeline_id": pipeline_id,
        "file_id": file_id
    })
    if existing_task:
        #TODO: Delete the existing task or block new task creation
        tasksDB.delete_one({
            "user_id": user_id,
            "pipeline_id": pipeline_id,
            "file_id": file_id
        })

    tasksDB.insert_one({
        "task_id": response.json().get("id"),
        "user_id": user_id,
        "user": user_id,
        "pipeline_id": pipeline_id,
        "file_id": file_id,
        "status": response.json().get("state", "PENDING"),
        "created_at": datetime.datetime.utcnow(),
    })

    return jsonify(response.json())

@app.route("/run-task/<string:taskId>", methods=['GET'])
def getTask(taskId):
    print ("Task_id: " + taskId)


    response = requests.get(f"{FUNNEL_URI}/{taskId}?view=FULL", headers={"Accept": "application/json", "Content-Type": ""}).json()
    print(response)

    if not response:
        return jsonify({"error": "Task not found"}), 404
    
    if response["state"] == 'COMPLETE':
        tasksDB.update_one({"task_id": taskId}, {"$set": {"status": "AWAITING REVIEW"}})
    else:
        tasksDB.update_one({"task_id": taskId}, {"$set": {"status": response["state"]}})

    return jsonify(response), 200

@app.route('/tasks', methods=['GET'])
def get_tasks():
    """Return all tasks for the user"""
    id_token = request.cookies.get('id_token')
    user_id = util.get_user_id(id_token)
    audit_logger.info(f"GET_TASKS | user_id={user_id} | IP={request.remote_addr}")
    
    if not user_id:
        audit_logger.warning(f"GET_TASKS | UNAUTHORIZED | IP={request.remote_addr}")
        return jsonify({"error": "Unauthorized"}), 401

    tasks = list(tasksDB.find({"user_id": user_id}))
    
    # Convert ObjectId to string
    for i in range(len(tasks)):
        tasks[i] = util.serialize_doc(tasks[i])

    return jsonify(tasks), 200

@app.route("/skos/label", methods=['GET'])
def get_skos_labels():
    uri = request.args.get('uri')
    if not uri:
        return jsonify(error="Missing 'uri' parameter"), 400

    try:
        response = requests.get(uri, headers={"Accept": "application/rdf+xml"})
        if response.status_code != 200:
            return jsonify(error="Failed to fetch RDF data"), 502

        xml = response.text
        root = ET.fromstring(xml)

        ns = {
            'skos': 'http://www.w3.org/2004/02/skos/core#',
            'xml': 'http://www.w3.org/XML/1998/namespace'
        }

        labels = {}
        for label in root.findall('.//skos:prefLabel', ns):
            lang = label.attrib.get('{http://www.w3.org/XML/1998/namespace}lang')
            if lang and label.text:
                labels[lang] = label.text

        return jsonify({
            "uri": uri,
            "prefLabel": labels
        })

    except Exception as e:
        return jsonify(error=str(e)), 500

@app.route('/contact-info')
def get_contact_info():
    uri = request.args.get('uri')
    print("[DEBUG] Received URI:", uri)
    if not uri:
        print("[DEBUG] No URI provided in request")
        return jsonify({"error": "Missing uri"}), 400

    try:
        if "orcid.org" in uri:
            print("[DEBUG] Detected ORCID URI")
            orcid_id = uri.split("/")[-1]
            print("[DEBUG] ORCID ID:", orcid_id)

            headers = {"Accept": "application/json"}
            resp = requests.get(f"https://pub.orcid.org/v3.0/{orcid_id}", headers=headers)
            print("[DEBUG] ORCID API response status:", resp.status_code)
            data = resp.json()
            print("[DEBUG] ORCID API response data:", data.get('person', {}))

            name = f"{data['person']['name']['given-names']['value']} {data['person']['name']['family-name']['value']}"
            print("[DEBUG] Extracted name:", name)

            return jsonify({"name": name})

        elif "ror.org" in uri:
            print("[DEBUG] Detected ROR URI")
            ror_id = uri.split("/")[-1]
            print("[DEBUG] ROR ID:", ror_id)
            resp = requests.get(f"https://api.ror.org/v2/organizations/{ror_id}")
            print("[DEBUG] ROR API response status:", resp.status_code)
            if resp.status_code != 200:
                print("[DEBUG] Failed to fetch ROR data")
                return jsonify({"error": "Failed to fetch ROR data"}), 502
            data = resp.json()
            print("[DEBUG] ROR API response data:", data)
            names = data.get('names', 'Unknown')
            print("[DEBUG] Extracted names:", names)

            for entrie in names:
                print("[DEBUG] Checking entry:", entrie)
                if 'label' in entrie.get('types', []):
                    name = entrie.get('value')
                    print("[DEBUG] Found English name:", name)
                    return jsonify({"name": name})

            print("[DEBUG] No English name found, using first entry")
            return jsonify({"name": names[0].get('value'), "email": None})

        else:
            print("[DEBUG] Unsupported UID format")
            return jsonify({"error": "Unsupported UID format"}), 400

    except Exception as e:
        print("[DEBUG] Exception occurred:", str(e))
        return jsonify({"error": str(e)}), 500



if __name__ == '__main__':
    audit_logger.info("SERVER_START")
    app.run(host='0.0.0.0', port=WEBSITE_BACKEND_PORT)
