from fastapi import FastAPI
from pydantic import BaseModel
import subprocess

app = FastAPI()

CONF = "s3cmd.conf"
SDA_SCRIPT = "./scripts/sda-admin"
SHARED_DIR = "/shared"


ERROR_MESSAGE = "Error in API request in S&I service"

def run_cmd(cmd):
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        output = result.stdout.strip() if result.stdout.strip() else result.stderr.strip()

        return output

    except subprocess.CalledProcessError as e:
        return {"success": False, "output": e.stderr.strip(), "code": e.returncode}

@app.get("/")
def read_root():
    return {"message": "FastAPI is running on port 5100"}

# Ingest - List inbox
@app.post("/sda/ingest/list")
def list_inbox():
    output = run_cmd([SDA_SCRIPT, "--sda-config", CONF, "ingest"])

    # If output is a dict, it's an error from run_cmd
    if isinstance(output, dict) and not output.get("success", True):
        return {"success": False, "files": [], "message": output.get("output", ERROR_MESSAGE)}
    # If output is not a string, return error
    if not isinstance(output, str):
        return {"success": False, "files": [], "message": ERROR_MESSAGE}

    files = [line.strip() for line in output.splitlines() if line.strip()]
    if files:
        return {"success": True, "files": files, "message": f"{len(files)} file(s) available for ingestion."}
    else:
        return {"success": True, "files": [], "message": "No files available for ingestion."}

# Ingest - Ingest a file
class IngestFileRequest(BaseModel):
    file_name: str

@app.post("/sda/ingest")
def ingest_file(req: IngestFileRequest):
    output = run_cmd([SDA_SCRIPT, "--sda-config", CONF, "ingest", req.file_name])
    if isinstance(output, dict) and not output.get("success", True):
        return {"success": False, "message": output.get("output", ERROR_MESSAGE)}
    if not isinstance(output, str):
        return {"success": False, "message": ERROR_MESSAGE}
    return {"success": True, "message": output}

# Accession a file
class AccessionFileRequest(BaseModel):
    unique_id: str
    file_name: str
# Accession - List pending
@app.post("/sda/accession/list")
def list_accession():
    output = run_cmd([SDA_SCRIPT, "--sda-config", CONF, "accession"])

    print ("DEBUG: Accession list output:", output)

    if isinstance(output, dict) and not output.get("success", True):
        return {"success": False, "files": [], "message": output.get("output", ERROR_MESSAGE)}
    if not isinstance(output, str):
        return {"success": False, "files": [], "message": ERROR_MESSAGE}

    files = [line.strip() for line in output.splitlines() if line.strip()]
    if files:
        return {"success": True, "files": files, "message": f"{len(files)} file(s) available for accession."}
    else:
        return {"success": True, "files": [], "message": "No files available for accession."}

@app.post("/sda/accession")
def accession_file(req: AccessionFileRequest):
    return run_cmd([SDA_SCRIPT, "--sda-config", CONF, "accession", req.unique_id, req.file_name])

# Map file to dataset
class MapDatasetRequest(BaseModel):
    dataset_id: str
    file_name: str

# Dataset - List pending
@app.post("/sda/dataset/list")
def list_dataset():
    output = run_cmd([SDA_SCRIPT, "--sda-config", CONF, "dataset"])

    if not output.get("success", True):
        return {"success": False, "files": [], "message": output.get("output", ERROR_MESSAGE)}
    files = [line.strip() for line in output.splitlines() if line.strip()]
    if files:
        return {"success": True, "files": files, "message": f"{len(files)} file(s) available for dataset."}
    else:
        return {"success": True, "files": [], "message": "No files available for dataset."}

@app.post("/sda/dataset")
def map_dataset(req: MapDatasetRequest):
    return run_cmd([SDA_SCRIPT, "--sda-config", CONF, "dataset", req.dataset_id, req.file_name])


@app.get("/sda/get/public-key")
def get_public_key():
    
    try:
        with open(SHARED_DIR + "/c4gh.pub.pem", "r") as f:
            public_key = f.read()
        return {"success": True, "public_key": public_key}
    except Exception as e:
        return {"success": False, "public_key": "", "message": str(e)}

