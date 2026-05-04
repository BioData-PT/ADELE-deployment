# Change values in .env to match OIDC creds and URLs
docker compose up -d

docker compose cp ingest:/shared/c4gh.pub.pem .


