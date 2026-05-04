# starter-kit-storage-and-interfaces

There exist two compose files at the root of the repo. Details on how to use them are provided below.

**Note:** Before deploying the stack, please make sure that all configuration files are in place. The following files need to be created from their respective examples:

```shell
cp ./config/config.yaml.example ./config/config.yaml
cp ./config/iss.json.example ./config/iss.json
cp ./.env.example ./.env
```

no further editing to the above files is required for running the stack locally.

## Starting the full stack with LS-AAI-mock

To bootstrap the *full stack* of `storage-and-interfaces` services use the file `docker-compose.yml`. Note that this requires a running [`LS-AAI-mock`](https://github.com/GenomicDataInfrastructure/starter-kit-lsaai-mock) service. To configure the LS-AAI-mock service follow the instructions below.

First clone the [startet-kit-lsaai-mock](https://github.com/GenomicDataInfrastructure/starter-kit-lsaai-mock) repo.

Add the `sda-auth` client by creating a file `configuration/aai-mock/clients/client1.yaml` with the following contents:

```ini
client-name: "auth"
client-id: "XC56EL11xx"
client-secret: "wHPVQaYXmdDHg"
redirect-uris: ["http://localhost:8085/oidc/login"]
token-endpoint-auth-method: "client_secret_basic"
scope: ["openid", "profile", "email", "ga4gh_passport_v1", "eduperson_entitlement"]
grant-types: ["authorization_code"]
post-logout-redirect-uris: ["http://localhost:8085/oidc/login"]
```

## Starting storage-and-interfaces with LS-AAI-mock

From the root of the `starter-kit-storage-and-interfaces` folder and run:

```shell
docker compose up -d
```

and then from the root folder of the `starter-kit-lsaai-mock` run:

```shell
docker compose up -d
```

## Starting the stack in standalone demo mode

The file `docker-compose-demo.yml` is used to start the `storage-and-interfaces` services in *demo* mode with an example dataset preloaded and ingested to the sensitive data archive when the deployment is done. This comes with its own python implementation of a mock-oidc in place of LS-AAI and can be run as standalone for demonstration purposes.

The files imported by the data loading script come from [here:](https://github.com/ga4gh/htsget-refserver/tree/main/data/gcp/gatk-test-data/wgs_bam)

To deploy use the following command:

```shell
docker compose -f docker-compose-demo.yml up -d
```

After deployment is done, follow the instructions below to test that the demo worked as expected.

### **Download unencrypted files directly**

### Get token for downloading data

For the purpose of the demo stack, tokens can be issued by the included `oidc` service and be used to authorize calls to the `download` service's API. The `oidc` is a simple Python implementation that mimics the basic OIDC functionality of LS-AAI. It does not require user authentication and serves a valid token through its `/token` endpoint:

```shell
token=$(curl -s -k https://localhost:8080/tokens | jq -r '.[0]')
```

This token is created upon deployment. See `scripts/make_credentials.sh` for more details. Note that the API returns a list of tokens where the first element is the token of interest, and the rest are tokens for [testing  `sda-download`](https://github.com/neicnordic/sda-download/blob/main/dev_utils/README.md#get-a-token).

### List datasets

```shell
curl -s -H "Authorization: Bearer $token" http://localhost:8443/metadata/datasets | jq .
```

### List files in a dataset

```shell
datasetID=$(curl -s -H "Authorization: Bearer $token" http://localhost:8443/metadata/datasets | jq -r .'[0]')
curl -s -H "Authorization: Bearer $token" "http://localhost:8443/metadata/datasets/$datasetID/files" | jq .
```

### Download a specific file

The `sda-download` service offers multiple methods for downloading files through the API, with options for both encrypted and unencrypted results. Below, you will find an example illustrating each of these methods.

To download the file `htsnexus_test_NA12878.bam`, first obtain the respective `fileID` using the following command. The `datasetID`, which is `DATASET0001`, can be obtained by following the instructions at [List datasets](#list-datasets)

```bash
filename="htsnexus_test_NA12878.bam"
fileID=$(curl -s -H "Authorization: Bearer $token" "http://localhost:8443/metadata/datasets/$datasetID/files" | jq -r --arg filename "$filename".c4gh '.[] | select(.displayFileName==$filename) | .fileId')
```

#### 1. Download unencrypted file from the `/files` endpoint
```bash
curl -s -H "Authorization: Bearer $token" http://localhost:8443/files/$fileID -o "$filename"
```
After successful execution, the BAM file `htsnexus_test_NA12878.bam` will be downloaded to your current folder.

#### 2. Download unencrypted file from the `/s3` endpoint
```bash
curl -s -H "Authorization: Bearer $token" http://localhost:8443/s3/$datasetID/$filename -o "$filename"
```

#### 3. Download encrypted file from the `/s3-encrypted` endpoint
To download an encrypted file that is re-encrypted with a custom Crypt4GH public key, you need to first create a key pair by the [`sda-cli`](https://github.com/NBISweden/sda-cli) tool, instructions can be found [here](https://github.com/NBISweden/sda-cli?tab=readme-ov-file#create-keys).

```bash
# create a crypt4gh key pair
sda-cli createKey c4gh
```
```bash
pubkey=$(base64 -w0 c4gh.pub.pem) 
curl -s -H "Authorization: Bearer $token" -H "Client-Public-Key: $pubkey" http://localhost:8443/s3-encrypted/$datasetID/$filename -o "$filename.c4gh"
```

After successful execution, the Crypt4GH encrypted BAM file `htsnexus_test_NA12878.bam.c4gh` will be downloaded to your current folder. This file can be decrypted using the private key of the key pair you have created by

```bash
sda-cli decrypt -key c4gh.sec.pem htsnexus_test_NA12878.bam.c4gh
```