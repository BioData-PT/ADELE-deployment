# Deploy

Change `config.edn` to match the OIDC credentials and the public URL. Then, create the DB and populate it appropriately:

```bash
docker compose up -d db
docker compose run --rm -e CMD="migrate" app
docker compose up -d app
```

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

## Create API credentials
**Important**: In this section we will create credentials that have different roles and are shared with different entities. Please always choose strong API keys and never use the same API key for different users.

Also, you should save the credentials (user ID + API key) somewhere, so you don't lose them. If you don't, you can either generate new ones or use `make psql` and check the tables `users` and `api_key`.

You can use `make api-key` to generate a random API key, in case it is helpful.

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
### Create owner api key (for creating other users/api keys)

```bash
bash scripts/create_owner_api_key.sh
```

### Create reporter credentials (for external services to retrieve permission data)
- Setup the reporter credentials:
```bash
export REPORTER_KEY="<NEW API KEY FOR REPORTER USER>"
export REPORTER_USER="<REPORTER USER ID> # optional
```

- Run the following command:
```bash
bash scripts/create_reporter_user.sh
```

If you want to test if the credentials for the reporter user are right, do `make try-reporter-creds` while having the env variables setup. If the command returns "forbidden" or "unauthorized", there is something wrong and you must fix it before sending them to the LS AAI people.

### Create organization owner credentials (for the TRE server to use)
- Setup the organization owner credentials. Once again, you can put whatever values you want, but choose a strong API KEY (and different from the reporter's!):

```bash
export ORG_OWNER_KEY="<NEW API KEY FOR ORG OWNER>"
export ORG_OWNER_USER="<ORG OWNER USER ID>" # optional
```

- Run the following command:
```bash
bash scripts/create_org_owner_user.sh
```

## How to change credentials
You might want to change your credentials later, specially when going from test to production. If you do, here's what you need to change:

- OIDC: Change config.edn
- DB: Change config.edn (database URL) AND docker-compose.yml (DB part)
- User API keys: Directly on the DB, use `make psql` and look for the *api_key* and *user* tables.

