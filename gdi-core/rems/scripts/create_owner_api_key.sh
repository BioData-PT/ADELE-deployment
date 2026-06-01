# NEED TO SET THE BELOW VARIABLES
# REMS_OWNER : ID of owner user
# REMS_OWNER_KEY : API key of the owner
set -e

VARIABLES=('REMS_OWNER' 'REMS_OWNER_KEY')

set -e

for VAR in "${VARIABLES[@]}"; do
    if [ -z "${!VAR}" ]; then
        echo "$VAR is unset or set to the empty string"
	exit 1
    fi
done


# create user in db if it doesn't exist already
docker compose exec db \
  psql -h localhost -U rems -d rems \
  -c "INSERT INTO users (userid, userattrs)
      VALUES (
        '$REMS_OWNER',
        '{\"name\":\"Owner User\",\"email\":\"$REMS_OWNER\"}'
      )
      ON CONFLICT (userid) DO NOTHING;"

# grant owner role to user
docker compose exec rems-app java -Drems.config=/rems/config/config.edn -jar rems.jar grant-role owner $REMS_OWNER \
    || \
    {
    echo "==================================================" && \
    echo "Error: granting owner role failed, you might need to login first as that user through the browser" && \
    echo "==================================================" && \
    exit 1
    }

# create api key
docker compose exec rems-app java -Drems.config=/rems/config/config.edn -jar rems.jar api-key add $REMS_OWNER_KEY owner key
# link api key to owner
docker compose exec rems-app java -Drems.config=/rems/config/config.edn -jar rems.jar api-key set-users $REMS_OWNER_KEY $REMS_OWNER

echo Credentials created for owner user:
echo user id: $REMS_OWNER
echo api key: $REMS_OWNER_KEY
