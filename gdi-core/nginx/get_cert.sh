#!/bin/bash
set -e

for d in MOCK_AAI REMS STORAGE_AUTH WEB WEB_API BACKOFFICE BACKOFFICE_API FDP
do
	varname=${d}_DOMAIN
	echo ${varname} = ${!varname}
done

# turn on required services to get the certs
docker compose up -d certbot nginx

# get the certs
docker compose exec certbot certbot certonly \
    --webroot --webroot-path=/var/www/certbot \
    --agree-tos --no-eff-email \
    --cert-name ${CERT_NAME} \
    -d $MOCK_AAI_DOMAIN -d $REMS_DOMAIN \
    -d $STORAGE_AUTH_DOMAIN \
    -d $WEB_DOMAIN -d $WEB_API_DOMAIN \
    -d $BACKOFFICE_DOMAIN \
    -d $BACKOFFICE_API_DOMAIN \
    -d $FDP_DOMAIN

if [ $? -ne 0 ]; then
    echo "Error: certbot failed to obtain certificates"
    exit 1
fi

# reload nginx to use the new certs
docker compose restart nginx



