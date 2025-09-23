#!/bin/bash

docker compose run --rm certbot certonly \
    --webroot --webroot-path=/var/www/certbot \
    --agree-tos --no-eff-email \
    -d fdp.adele.inesc-id.pt -d rems.adele.inesc-id.pt \
    -d inbox.adele.inesc-id.pt -d login.adele.inesc-id.pt \
    -d download.adele.inesc-id.pt -d backoffice.adele.inesc-id.pt \
    -d website.adele.inesc-id.pt -d website-api.adele.inesc-id.pt \
    -d backoffice-api.adele.inesc-id.pt


