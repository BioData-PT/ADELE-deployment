from datetime import timedelta
from flask import Blueprint,request, jsonify, session
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
import os
from flask import session
from config.audit_logger import audit_logger


user_bp = Blueprint('user', __name__)
client = MongoClient(os.getenv("MONGO_URI"))
db = client["users"]
staffDB = db["staff_info"]

@user_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    if not all(k in data for k in ("username", "password", "role")):
        audit_logger.warning(f"REGISTER | MISSING_FIELDS | username={data.get('username', 'unknown')} | IP={request.remote_addr}")
        return jsonify({"error": "Missing fields"}), 400
    if staffDB.find_one({"username": data["username"]}):
        audit_logger.warning(f"REGISTER | USERNAME_EXISTS | username={data['username']} | IP={request.remote_addr}")
        return jsonify({"error": "Username already exists"}), 409
    hashed_pw = generate_password_hash(data["password"])
    user = {
        "name": data["name"],
        "username": data["username"],
        "password": hashed_pw,
        "role": data["role"]
    }
    staffDB.insert_one(user)
    audit_logger.info(f"REGISTER | SUCCESS | username={user['username']} | role={user['role']} | IP={request.remote_addr}")
    return jsonify({"message": "User registered"}), 201

@user_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    user = staffDB.find_one({"username": data.get("username")})
    if not user or not check_password_hash(user["password"], data.get("password")):
        audit_logger.warning(f"LOGIN | FAILED | username={data.get('username', 'unknown')} | IP={request.remote_addr}")
        return jsonify({"error": "Invalid credentials"}), 401
    session['user_id'] = str(user['_id'])
    session['username'] = user['username']
    session['role'] = user['role']
    session.permanent = True
    audit_logger.info(f"LOGIN | SUCCESS | user_id={user['_id']} | username={user['username']} | role={user['role']} | IP={request.remote_addr}")
    return jsonify({"message": "Logged in", "name": user["name"], "role": user["role"]}), 200

@user_bp.route('/logout', methods=['POST'])
def logout():
    user_id = session.get('user_id', 'unknown')
    username = session.get('username', 'unknown')
    audit_logger.info(f"LOGOUT | user_id={user_id} | username={username} | IP={request.remote_addr}")
    session.clear()
    return jsonify({"message": "Logged out"}), 200

@user_bp.route('/me', methods=['GET'])
def me():
    user_id = session.get('user_id')
    username = session.get('username', 'unknown')
    role = session.get('role', 'unknown')
    if not user_id:
        audit_logger.warning(f"ME | UNAUTHORIZED | IP={request.remote_addr}")
        return jsonify({"error": "Unauthorized"}), 401
    user = staffDB.find_one({"_id": ObjectId(user_id)}, {"_id": 0, "password": 0})
    if not user:
        audit_logger.warning(f"ME | NOT_FOUND | user_id={user_id} | username={username} | IP={request.remote_addr}")
        return jsonify({"error": "User not found"}), 404
    if not user.get('role') or user['role'] != role:
        audit_logger.warning(f"ME | ROLE_MISMATCH_OR_NOT_FOUND | user_id={user_id} | username={username} | role={role} | IP={request.remote_addr}")
        return jsonify({"error": "User role not found"}), 404
    if not user.get('name') or user['name'].strip() == "" or user['name'] != username:
        audit_logger.warning(f"ME | NAME_MISSING_OR_NOT_FOUND | user_id={user_id} | username={username} | role={role} | IP={request.remote_addr}")
        return jsonify({"error": "User name is missing"}), 400
    audit_logger.info(f"ME | SUCCESS | user_id={user_id} | username={username} | role={role} | IP={request.remote_addr}")
    user['user_id'] = str(user_id)
    user['username'] = username
    user['role'] = role
    return jsonify(user), 200
