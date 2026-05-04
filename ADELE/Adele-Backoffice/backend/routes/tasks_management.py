from flask import Blueprint, request, session
import requests
from config.settings import * 
from pymongo import MongoClient
from config.audit_logger import audit_logger

task_management_bp = Blueprint('task_management', __name__)

client = MongoClient(MONGO_URI)
dbUser = client["users"]
tasksDB = dbUser["tasks"]


@task_management_bp.route('/tasks', methods=['GET'])
def get_tasks():
    user_id = session.get('user_id', 'unknown')
    username = session.get('username', 'unknown')
    print("[DEBUG] Fetching tasks from the funnel service...")
    audit_logger.info(f"GET_TASKS | user_id={user_id} | username={username} | IP={request.remote_addr}")

    # Call the funnel service to get the tasks
    response = requests.get(FUNNEL_URI)

    # Debugging output to check the response status
    print("[DEBUG] Funnel service response:", response.json())
    print(f"[DEBUG] Funnel service response status: {response.status_code}")
    
    if response.status_code == 200:
        audit_logger.info(f"GET_TASKS | SUCCESS | user_id={user_id} | username={username} | IP={request.remote_addr}")
        return response.json(), 200
    else:
        audit_logger.warning(f"GET_TASKS | FAILED | user_id={user_id} | username={username} | IP={request.remote_addr}")
        return {"error": "Failed to retrieve tasks"}, 500


def updateTaskStatus(user_id, filename, pipeline, status):
    """
    Update the status of a task in the funnel service.
    """
    print(f"[DEBUG] Updating task status for user {user_id}, file {filename} to {status}...")
    audit_logger.info(f"UPDATE_TASK_STATUS | user_id={user_id} | filename={filename} | pipeline={pipeline} | status={status}")

    # Update the tasks status in the database
    task = tasksDB.find_one({"user_id": user_id, "filename": filename, "pipeline": pipeline})
    if not task:
        print("[ERROR] Task not found in the database.")
        audit_logger.warning(f"UPDATE_TASK_STATUS | NOT_FOUND | user_id={user_id} | filename={filename} | pipeline={pipeline}")
        return {"error": "Task not found"}, 404
    
    # Update the task status
    tasksDB.update_one({"_id": task["_id"]}, {"$set": {"status": status}})

    print("[DEBUG] Task status updated successfully.")
    audit_logger.info(f"UPDATE_TASK_STATUS | SUCCESS | user_id={user_id} | filename={filename} | pipeline={pipeline} | status={status}")
    return {"message": "Task status updated successfully"}, 200
