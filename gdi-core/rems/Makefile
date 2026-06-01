.PHONY: psql api-key

psql:
	@docker compose exec db psql -h localhost -U rems

api-key:
	@docker compose run --rm jwk-generator python3 generate_api_key.py

try-reporter-creds:
	@curl -w "\n" http://localhost:3000/api/permissions/${REMS_OWNER}?expired=false \
    		-H "content-type: application/json" \
    		-H "x-rems-api-key: ${REPORTER_KEY}" \
		-H "x-rems-user-id: ${REPORTER_USER}"
