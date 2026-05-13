# NEED TO SET THE BELOW VARIABLES
# REMS_OWNER : ID of owner user
# REMS_OWNER_KEY : API key of the owner
# REMS_API_KEY : String of the to-be API key for the org owner
# REMS_USER_ID : user id for the robot org owner user
# USER_DESC : description of the robot user

VARIABLES=('REMS_OWNER' 'REMS_OWNER_KEY' 'REMS_API_KEY')

set -e

for VAR in "${VARIABLES[@]}"; do
    if [ -z "${!VAR}" ]; then
        echo "$VAR is unset or set to the empty string"
	exit 1
    fi
done

USER_DESC=${USER_DESC-"organization owner user"}
REMS_USER_ID=${REMS_USER_ID-"org-owner-robot"}

docker compose exec rems-app java -Drems.config=/rems/config/config.edn -jar rems.jar api-key add $REMS_API_KEY key for organization owner

# create user through API, using owner credentials
curl -X POST http://localhost:3000/api/users/create \
   -H "content-type: application/json" \
   -H "x-rems-api-key: $REMS_OWNER_KEY" \
   -H "x-rems-user-id: $REMS_OWNER" \
   -d "{
        \"userid\": \"$REMS_USER_ID\", \"name\": \"$USER_DESC\", \"email\": null
    }"

# grant role
docker compose exec rems-app java -Drems.config=/rems/config/config.edn -jar rems.jar grant-role user-owner $REMS_USER_ID
# link user to api key
docker compose exec rems-app java -Drems.config=/rems/config/config.edn -jar rems.jar api-key set-users $REMS_API_KEY $REMS_USER_ID
# allow api key to use all /api GET endpoints
docker compose exec rems-app java -Drems.config=/rems/config/config.edn -jar rems.jar api-key allow $REMS_API_KEY get '/api/.*'
# allow api key to use all /api POST endpoints
docker compose exec rems-app java -Drems.config=/rems/config/config.edn -jar rems.jar api-key allow $REMS_API_KEY post '/api/.*'

echo Credentials created for organization owner user:
echo user id: $REMS_USER_ID
echo api key: $REMS_API_KEY
