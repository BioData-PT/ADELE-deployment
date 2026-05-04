from flask import Flask, json, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from bson import ObjectId
from flask import session

from config.settings import * 

from routes.file_handling import file_handling_bp
from routes.tasks_management import task_management_bp
from routes.si_management import si_management_bp
from routes.user_management import user_bp
from routes.communication import send_simple_message_templates as send_email
from config.audit_logger import audit_logger

app = Flask(__name__)
CORS(app, supports_credentials=True)

app.secret_key = os.environ.get('SESSION_SECRET_KEY', 'default-secret-key')

app.config.update(
    SESSION_COOKIE_SAMESITE='None',
    SESSION_COOKIE_SECURE=False,   # only for local HTTP; switch to True on HTTPS
    SESSION_COOKIE_HTTPONLY=True,
)

app.register_blueprint(file_handling_bp, url_prefix='/files')
app.register_blueprint(task_management_bp, url_prefix='/api')
app.register_blueprint(si_management_bp, url_prefix='/api/si')
app.register_blueprint(user_bp, url_prefix='/api/user')


client = MongoClient(MONGO_URI)
dbProject = client["project"]
dbPipeline = client["pipeline"]

projects_collection = dbProject["project_details"]
pipelines_collection = dbPipeline["pipeline_details"]

# Helper to convert ObjectId to string
def serialize_doc(doc):
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc

# Helper to extract user info from request (JWT or session)
def get_user_info():
    user_id = session.get('user_id', 'unknown')
    username = session.get('username', 'unknown')
    return user_id, username

## Health Check
@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy"}), 200

@app.route("/api/projects", methods=["GET"])
def get_projects():
    projects = [serialize_doc(p) for p in projects_collection.find()]
    user_id, username = get_user_info()
    audit_logger.info(f"GET_PROJECTS | user_id={user_id} | username={username} | IP={request.remote_addr}")
    print("Projects:", projects)  
    return jsonify(projects)

@app.route("/api/projects/<id>", methods=["GET"])
def get_project(id):
    project = projects_collection.find_one({"_id": ObjectId(id)})
    user_id, username = get_user_info()
    if not project:
        audit_logger.warning(f"GET_PROJECT | NOT_FOUND | user_id={user_id} | username={username} | IP={request.remote_addr} | id={id}")
        return jsonify({"error": "Project not found"}), 404
    audit_logger.info(f"GET_PROJECT | user_id={user_id} | username={username} | IP={request.remote_addr} | id={id}")
    return jsonify(serialize_doc(project))

@app.route("/api/projects/<id>", methods=["PATCH"])
def update_project_status(id):
    print("Updating project with ID:", id)  
    project = projects_collection.find_one({"_id": ObjectId(id)})
    user_id, username = get_user_info()
    if not project:
        audit_logger.warning(f"UPDATE_PROJECT_STATUS | NOT_FOUND | user_id={user_id} | username={username} | IP={request.remote_addr} | id={id}")
        return jsonify({"error": "Project not found"}), 404
    print("Project found:", project)
    status = request.json.get("status")
    if not status:
        audit_logger.warning(f"UPDATE_PROJECT_STATUS | MISSING_STATUS | user_id={user_id} | username={username} | IP={request.remote_addr} | id={id}")
        return jsonify({"error": "Status is required"}), 400
    result = projects_collection.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"status": status}}
    )
    if result.matched_count == 0:
        audit_logger.warning(f"UPDATE_PROJECT_STATUS | NOT_FOUND | user_id={user_id} | username={username} | IP={request.remote_addr} | id={id}")
        return jsonify({"error": "Project not found"}), 404
    send_email(project["responsable"], 
        "Project Status Update",
        "project update message",
        {"username": username} 
    )
    audit_logger.info(f"UPDATE_PROJECT_STATUS | SUCCESS | user_id={user_id} | username={username} | IP={request.remote_addr} | id={id} | status={status}")
    updated_project = projects_collection.find_one({"_id": ObjectId(id)})
    return jsonify(serialize_doc(updated_project))

@app.route("/api/pipelines", methods=["GET"])
def get_pipelines():
    pipelines = list(pipelines_collection.find({},{"_id": 0}))
    user_id, username = get_user_info()
    audit_logger.info(f"GET_PIPELINES | user_id={user_id} | username={username} | IP={request.remote_addr}")
    print("Pipelines:", pipelines)  # Debugging line
    return jsonify(pipelines)

@app.route("/api/pipelines", methods=["POST"])
def create_pipeline():
    data = request.get_json()
    payload = data.get("payload")
    user_id, username = get_user_info()
    print("Creating pipeline with data:", payload)
    if not payload or "name" not in payload:
        audit_logger.warning(f"CREATE_PIPELINE | MISSING_NAME | user_id={user_id} | username={username} | IP={request.remote_addr}")
        return jsonify({"error": "Pipeline name is required"}), 400
    existing = pipelines_collection.find_one({
        "payload": {"$regex": f'"name":"{payload["name"]}"'}
    })
    if existing:
        audit_logger.warning(f"CREATE_PIPELINE | DUPLICATE_NAME | user_id={user_id} | username={username} | IP={request.remote_addr} | name={payload['name']}")
        return jsonify({"error": "Pipeline name already exists"}), 400
    def get_next_string_id():
        docs = pipelines_collection.find({}, {"id": 1})
        max_id = 0
        for doc in docs:
            try:
                max_id = max(max_id, int(doc.get("id", 0)))
            except (ValueError, TypeError):
                pass
        return str(max_id + 1)
    document = {
        "id": get_next_string_id(),
        "payload": json.dumps(payload)
    }
    result = pipelines_collection.insert_one(document)
    audit_logger.info(f"CREATE_PIPELINE | SUCCESS | user_id={user_id} | username={username} | IP={request.remote_addr} | id={document['id']} | name={payload['name']}")
    return jsonify({"id": str(result.inserted_id)}), 201

@app.route("/api/pipelines/<string:id>", methods=["PUT"])
def update_pipeline(id):
    data = request.json
    payload = data.get("payload")
    user_id, username = get_user_info()
    print("Updating pipeline with data:", data)  # Debugging line
    if not payload or "name" not in payload or not data["id"]:
        audit_logger.warning(f"UPDATE_PIPELINE | MISSING_NAME_OR_ID | user_id={user_id} | username={username} | IP={request.remote_addr} | id={id}")
        return jsonify({"error": "Pipeline name and ID are required"}), 400
    result = pipelines_collection.update_one({"id": id}, {"$set": {"payload": json.dumps(payload)}})
    if result.matched_count == 0:
        audit_logger.warning(f"UPDATE_PIPELINE | NOT_FOUND | user_id={user_id} | username={username} | IP={request.remote_addr} | id={id}")
        return jsonify({"error": f"No pipeline found with id {id}"}), 40
    audit_logger.info(f"UPDATE_PIPELINE | SUCCESS | user_id={user_id} | username={username} | IP={request.remote_addr} | id={id} | name={payload['name']}")
    return jsonify({"message": f"Pipeline {id} updated successfully"}), 200

@app.route("/api/pipelines/<string:id>", methods=["DELETE"])
def delete_pipeline(id):
    print("Deleting pipeline with ID:", id)
    user_id, username = get_user_info()
    result = pipelines_collection.delete_one({"id": id})
    if result.deleted_count == 0:
        audit_logger.warning(f"DELETE_PIPELINE | NOT_FOUND | user_id={user_id} | username={username} | IP={request.remote_addr} | id={id}")
        return jsonify({"error": "Pipeline not found"}), 404
    audit_logger.info(f"DELETE_PIPELINE | SUCCESS | user_id={user_id} | username={username} | IP={request.remote_addr} | id={id}")
    return jsonify({"message": "Pipeline deleted successfully"}), 200

if __name__ == "__main__":
    audit_logger.info("SERVER_START")
    app.run(host='0.0.0.0', port=BACKOFFICE_BACKEND_PORT)



