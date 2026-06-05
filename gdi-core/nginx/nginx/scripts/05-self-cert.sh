#!/bin/bash
set -e

# @author Adriano Rosa (http://adrianorosa.com)
# @date: 2014-05-13 09:43
#
# Bash Script to create a new self-signed SSL Certificate
# At the end of creating a new Certificate this script will output a few lines
# to be copied and placed into NGINX site conf

# Default dir to place the Certificate
#DIR_SSL_CERT="/etc/nginx/ssl/cert"
#DIR_SSL_KEY="/etc/nginx/ssl/private"

# setup is now on env vars
#DIR_SSL_CERT="/etc/nginx/self-signed/cert"
#DIR_SSL_KEY="/etc/nginx/self-signed/private"

if [[ -d $DIR_SSL_KEY ]]; then
   echo "The self-signed cert already exists, no need to recreate it"
   exit 0
fi

# setup is now on env vars
#SSLNAME=tre-cert-self-signed
SSLDAYS=10000

echo "Creating a new Certificate ..."
#openssl req -x509 -nodes -newkey rsa:2048 -keyout $SSLNAME.key -out $SSLNAME.crt -days $SSLDAYS
openssl req -x509 -nodes -newkey rsa:2048 \
  -keyout $SSLNAME.key \
  -out $SSLNAME.crt \
  -days $SSLDAYS \
  -subj "/CN=$WEB_DOMAIN" \
  -addext "subjectAltName=DNS:$MOCK_AAI_DOMAIN,DNS:$REMS_DOMAIN,DNS:$FDP_DOMAIN,DNS:$STORAGE_AUTH_DOMAIN,DNS:$WEB_DOMAIN,DNS:$WEB_API_DOMAIN,DNS:$BACKOFFICE_DOMAIN,DNS:$BACKOFFICE_API_DOMAIN"

# Make directory to place SSL Certificate if it doesn't exists
if [[ ! -d $DIR_SSL_KEY ]]; then
  mkdir -p $DIR_SSL_KEY
fi

if [[ ! -d $DIR_SSL_CERT ]]; then
  mkdir -p $DIR_SSL_CERT
fi

# Place SSL Certificate within defined path
cp $SSLNAME.key $DIR_SSL_KEY/$SSLNAME.key
cp $SSLNAME.crt $DIR_SSL_CERT/$SSLNAME.crt

# Print output for Nginx site config
printf "+-------------------------------
+ SSL Certificate has been created.
+ Here is the NGINX Config for $SSLNAME
+ Copy it into your nginx config file
+-------------------------------\n\n
ssl_certificate      $DIR_SSL_CERT/$SSLNAME.crt;
ssl_certificate_key  $DIR_SSL_KEY/$SSLNAME.key;

ssl_session_cache shared:SSL:1m;
ssl_session_timeout  5m;\n\n"
