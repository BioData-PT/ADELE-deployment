# NEED TO SET THE BELOW VARIABLES
# REMS_OWNER : ID of owner user
# OWNER_KEY : API key of the owner
set -e

VARIABLES=('REMS_OWNER' 'OWNER_KEY')

set -e

for VAR in "${VARIABLES[@]}"; do
    if [ -z "${!VAR}" ]; then
        echo "$VAR is unset or set to the empty string"
	exit 1
    fi
done


# create api key
docker compose exec app java -Drems.config=/rems/config/config.edn -jar rems.jar api-key add $OWNER_KEY owner key
# link api key to owner
docker compose exec app java -Drems.config=/rems/config/config.edn -jar rems.jar api-key set-users $OWNER_KEY $REMS_OWNER

echo Credentials:
echo user id: $REMS_OWNER
echo api key: $OWNER_KEY
