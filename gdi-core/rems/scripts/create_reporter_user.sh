# NEED TO SET THE BELOW VARIABLES
# REMS_OWNER : ID of owner user
# REMS_OWNER_KEY : API key of the owner
# REPORTER_API_KEY : String of the to-be API key
# REPORTER_USER : user id for the robot user
# USER_DESC : description of the robot user

VARIABLES=('REMS_OWNER' 'REMS_OWNER_KEY' 'REPORTER_API_KEY')

set -e

for VAR in "${VARIABLES[@]}"; do
    if [ -z "${!VAR}" ]; then
        echo "$VAR is unset or set to the empty string"
	exit 1
    fi
done

USER_DESC=${USER_DESC-"reporter user"}
REPORTER_USER=${REPORTER_USER-"reporter-robot"}

# create API key
docker compose exec rems-app java -Drems.config=/rems/config/config.edn -jar rems.jar api-key add $REPORTER_API_KEY key for reporter user

# create user through API, using owner credentials
curl -X POST http://localhost:3000/api/users/create \
   -H "content-type: application/json" \
   -H "x-rems-api-key: $REMS_OWNER_KEY" \
   -H "x-rems-user-id: $REMS_OWNER" \
   -d "{
        \"userid\": \"${REPORTER_USER}\", \"name\": \"${USER_DESC}\", \"email\": null
   }"

# grant role
docker compose exec rems-app java -Drems.config=/rems/config/config.edn -jar rems.jar grant-role reporter $REPORTER_USER
# link user to api key
docker compose exec rems-app java -Drems.config=/rems/config/config.edn -jar rems.jar api-key set-users $REPORTER_API_KEY $REPORTER_USER
# allow api key to use all /api GET endpoints
docker compose exec rems-app java -Drems.config=/rems/config/config.edn -jar rems.jar api-key allow $REPORTER_API_KEY get '/api/.*'

echo Credentials created for reporter user:
echo user id: $REPORTER_USER
echo api key: $REPORTER_API_KEY
