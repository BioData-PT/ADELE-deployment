# Deploy
- Change auth and OIDC redirect URLs in `docker-compose.yml`, you only need to change the domains and (possibly) the scheme.
- Run `cp .env.example .env`
- Change S3 and OIDC credentials in .env
- Go to `config/config.yaml` and change auth.s3Inbox to match your inbox domain.
- You might need to change the OIDC configuration URL as well as the trusted Visa issuers(config/iss.json) when transitioning from test environment to prod, but only if you change the OIDC provider (i.e., LS AAI or some mock) and/or the REMS instance used for issuing Visas.

# Extra
- Using external DB or S3 means you also have to modify config/config.yaml accordingly.
