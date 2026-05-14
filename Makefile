.PHONY: ps
include .env
SHELL := /bin/bash

ps:
	@docker compose ps -a --format 'table {{.Service}}\t{{.CreatedAt}}\t{{.Status}}'

get-cert:
	@BASH_ENV=.env bash ./gdi-core/nginx/get_cert.sh

clean-certs:
	# erase certbot certificates and challenges
	@rm -rf gdi-core/nginx/certbot/{conf,www}/*

api-key:
	@docker compose run --rm jwk-generator python3 generate_api_key.py

create-rems-roles:
	@docker compose up -d rems-app
	@echo "Creating API key for owner..."
	@BASH_ENV=.env bash ./gdi-core/rems/scripts/create_owner_api_key.sh
	@docker compose restart rems-app
	
	@echo "Waiting for rems-app to become healthy..."
	@until [ "$$(docker inspect -f '{{.State.Health.Status}}' $$(docker compose ps -q rems-app))" = "healthy" ]; do \
		sleep 2; \
	done
	@echo "Creating API key for organization owner..."
	@BASH_ENV=.env bash ./gdi-core/rems/scripts/create_org_owner_user.sh
	@echo "Creating reporter user..."
	@BASH_ENV=.env bash ./gdi-core/rems/scripts/create_reporter_user.sh
	@echo "Done! Restarting rems-app to apply changes..."
	@docker compose restart rems-app
	@echo All done!

clean-rems-roles:
	@docker compose exec db psql -h localhost -U rems -c "DELETE FROM api_key;"
	@docker compose exec db psql -h localhost -U rems -c "DELETE FROM roles;"

# access REMS DB
psql:
	@docker compose exec db psql -h localhost -U rems

try-reporter-creds:
	@curl -w "\n" "http://localhost:3000/api/permissions/${REMS_OWNER}?expired=false" \
    		-H "content-type: application/json" \
    		-H "x-rems-api-key: ${REPORTER_API_KEY}" \
			-H "x-rems-user-id: ${REPORTER_USER}" \
			&& echo "Reporter credentials are valid!"

print-owner:
	@printf '<%s>\n' "$(REMS_OWNER)"