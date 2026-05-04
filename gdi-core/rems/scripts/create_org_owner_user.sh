# NEED TO SET THE BELOW VARIABLES
# REMS_OWNER : ID of owner user
# OWNER_KEY : API key of the owner
# ORG_OWNER_KEY : String of the to-be API key
# ORG_OWNER_USER : user id for the robot user
# USER_DESC : description of the robot user

VARIABLES=('REMS_OWNER' 'OWNER_KEY' 'ORG_OWNER_KEY')

set -e

for VAR in "${VARIABLES[@]}"; do
    if [ -z "${!VAR}" ]; then
        echo "$VAR is unset or set to the empty string"
	exit 1
    fi
done

USER_DESC=${USER_DESC-"organization owner user"}
ORG_OWNER_USER=${ORG_OWNER_USER-"org-owner-robot"}

docker compose exec app java -Drems.config=/rems/config/config.edn -jar rems.jar api-key add $ORG_OWNER_KEY key for organization owner

curl -X POST http://localhost:3000/api/users/create \
   -H "content-type: application/json" \
   -H "x-rems-api-key: $OWNER_KEY" \
   -H "x-rems-user-id: $REMS_OWNER" \
   -d "{
        \"userid\": \"$ORG_OWNER_USER\", \"name\": \"$USER_DESC\", \"email\": null
   }"

# grant role
docker compose exec app java -Drems.config=/rems/config/config.edn -jar rems.jar grant-role user-owner $ORG_OWNER_USER
# link user to api key
docker compose exec app java -Drems.config=/rems/config/config.edn -jar rems.jar api-key set-users $ORG_OWNER_KEY $ORG_OWNER_USER
# allow api key to use all /api GET endpoints
docker compose exec app java -Drems.config=/rems/config/config.edn -jar rems.jar api-key allow $ORG_OWNER_KEY get '/api/.*'
# allow api key to use all /api POST endpoints
docker compose exec app java -Drems.config=/rems/config/config.edn -jar rems.jar api-key allow $ORG_OWNER_KEY post '/api/.*'

echo Credentials:
echo user id: $ORG_OWNER_USER
echo api key: $ORG_OWNER_KEY
