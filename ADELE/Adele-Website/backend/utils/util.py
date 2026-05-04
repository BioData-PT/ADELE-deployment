import requests
from config.settings import *
import jwt
from datetime import datetime
from bson import ObjectId

from typing import List, Union

# Helper to convert ObjectId to string
def serialize_doc(doc):
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc


def get_fdp_token():
    print("DEBUG: Attempting to retrieve token")
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    print(f"DEBUG: Headers for token request: {headers}")

    if not FDP_ADMIN_USERNAME or not FDP_ADMIN_PASSWORD:
        print("ERROR: FDP_ADMIN_USERNAME or FDP_ADMIN_PASSWORD is not set in settings.")
        return None

    data = {
        "email": FDP_ADMIN_USERNAME,
        "password": FDP_ADMIN_PASSWORD
    }
    print(f"DEBUG: Payload for token request: {data}")

    response = requests.post(f"{FDP_URL}/tokens", headers=headers, json=data)
    print(f"DEBUG: Response from token endpoint: {response.status_code}, {response.text}")
    
    if response.status_code == 200:
        # Extract the token from the response
        token = response.json().get("token")
        if token:
            print(f"DEBUG: Token retrieved: {token}")
            return token
        else:
            print("ERROR: Token not found in response")
            return None
    else:
        print(f"ERROR: Failed to retrieve token, status code: {response.status_code}")
        return None

def get_user_id(id_token): 
    if not id_token:
        print ('id_token not found')
        return None
    
    try:
        user = jwt.decode(id_token, CLIENT_SECRET, options={"verify_signature": False, "verify": False}).get("sub") 
        print(user)
        return user

    except jwt.ExpiredSignatureError:
        print ('ExpiredSignatureError')
        return None
    
    except jwt.InvalidTokenError:
        print('InvalidTokenError')
        return None


