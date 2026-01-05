# Deployment Guide
In the following section, the steps to deploy the ADELE TRE with all its components are described in detail. The instructions assume a Linux system and that you have experience using vim, but other OS's and text editors can be used as well.

## Pre-requisites
- Docker and Docker Compose plugin
- Git
- Public URL (some services require valid HTTPS connection)

## Changes before first start-up

- Execute `vim nginx/nginx/confs_docker/*.conf` and comment every https server block (i.e., all that mention port 443). Not doing so will make the nginx container crash because it won't be able to find the certificates in the conf file.
- Change domains in `nginx/nginx/confs_docker/` files and in `nginx/get_cert.sh` (in the script, you need to have a `-d` before each domain).

## First start-up
To run the stack, execute the following commands in the root directory of the repository:
```bash
docker compose up -d db
docker compose run --rm -e CMD="migrate" app
docker compose up -d
```
If any error pops up, check the logs of the troubled container and look for the configuration in the respective module inside gdi-core.

The first step is to get the configuration running with minimal changes and using a mock OIDC client. The next steps are going to be to set up a real OIDC client and get valid HTTPS certificates and then change your configuration accordingly.

Check if:
- FAIR Data Point is reachable at `http://localhost:8667/` using curl or a web browser.
- REMS is reachable at `http://localhost:3000/` using curl or a web browser.
- Funnel is reachable at `http://localhost:8010/` using curl.
- Run `docker compose ps -a | grep -i exit` and check that all containers that show up have exited with success (exit code 0).

If any of these services is not behaving as expected, check the logs of the respective container using `docker compose logs <container-name>`.


## Configuration

### Nginx
After modifying the configurations in `nginx/nginx/confs_docker/` and `nginx/get_cert.sh` to match your domains, run `bash get_cert.sh` and follow the steps to get valid HTTPS certificates using Let's Encrypt. Make sure that ports 80 and 443 are open in your firewall for the domains you are using.

### REMS

Change `config.edn` to match the OIDC credentials and the public URL.

After that, access REMS using the web browser (default is localhost:3000), log into the account that is supposed to be the admin (e.g., the account of the person doing these steps) and go to /profile.
At this endpoint, you can see your username, that should look something like "123456abdecf@lifescience-ri.eu", copy it to the clipboard and save it in a variable in terminal:
```bash
export REMS_OWNER="<YOUR USERNAME>"
```

Grant it owner role:
```bash
docker compose exec app java -Drems.config=/rems/config/config.edn -jar rems.jar grant-role owner $REMS_OWNER
```

Restart the app to load the account as owner:
```bash
docker compose restart app
```

#### Create API credentials
**Important**: In this section we will create credentials that have different roles and are shared with different entities. Please always choose strong API keys and never use the same API key for different users.

Also, you should save the credentials (user ID + API key) somewhere, so you don't lose them. If you don't, you can either generate new ones or use `make -C gdi-core/rems psql` and check the tables `users` and `api_key`.

You can use `make -C gdi-core/rems api-key` to generate a random API key, in case it is helpful.

Also, instead of setting up the credentials in the shell, you can use the template .env file:
```bash
cp credentials/credentials.sh.example credentials/credentials.sh
vim credentials/credentials.sh
source credentials/credentials.sh
```

- Setup the relevant credentials:
```bash
export REMS_OWNER="<USERNAME OF THE OWNER>"
export OWNER_KEY="<API KEY TO BE USED BY THE OWNER>"
```
#### Create owner api key (for creating other users/api keys)

```bash
bash gdi-core/rems/scripts/create_owner_api_key.sh
```

#### Create reporter credentials (for external services to retrieve permission data)
- Setup the reporter credentials:
```bash
export REPORTER_KEY="<NEW API KEY FOR REPORTER USER>"
export REPORTER_USER="<REPORTER USER ID> # optional
```

- Run the following command:
```bash
bash gdi-core/rems/scripts/create_reporter_user.sh
```

If you want to test if the credentials for the reporter user are right, do `make try-reporter-creds` while having the env variables setup. If the command returns "forbidden" or "unauthorized", there is something wrong and you must fix it before sending them to the LS AAI people.

#### Create organization owner credentials (for the TRE server to use)
- Setup the organization owner credentials. Once again, you can put whatever values you want, but choose a strong API KEY (and different from the reporter's!):

```bash
export ORG_OWNER_KEY="<NEW API KEY FOR ORG OWNER>"
export ORG_OWNER_USER="<ORG OWNER USER ID>" # optional
```

- Run the following command:
```bash
bash scripts/create_org_owner_user.sh
```

#### How to change credentials
You might want to change your credentials later, specially when going from test to production. If you do, here's what you need to change:

- OIDC: Change config.edn
- DB: Change config.edn (database URL) AND docker-compose.yml (DB part)
- User API keys: Directly on the DB, use `make -C gdi-core/rems psql` and look for the *api_key* and *user* tables.

### Funnel
- Change the values in Funnel configuration using `vim gdi-core/funnel-sk/config/config.yaml` to match the public URL and the S3 endpoint credentials
- If you don't change the S3 part, it will use the s3 container in storage & interfaces (already included in the deployment)
- For the time being, we will leave this service as only available internally (because of other services that depend on it).

### FAIR Data Point (FDP)
- Change the values in FDP configuration using `vim gdi-core/fdp/config/application.properties` to match the public URL and the database credentials (if you changed them from the default ones)

### Storage & Interfaces
