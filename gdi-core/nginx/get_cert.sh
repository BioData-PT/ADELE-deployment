#!/bin/bash

docker compose run --rm certbot certonly \
    --webroot --webroot-path=/var/www/certbot \
    --agree-tos --no-eff-email \
    -d fdp.gdi.biodata.pt -d rems.gdi.biodata.pt \
    -d inbox.gdi.biodata.pt -d login.gdi.biodata.pt \
    -d download.gdi.biodata.pt


