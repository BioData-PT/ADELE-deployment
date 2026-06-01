#!/bin/bash
set -e

TEMPLATE_FILETREE=/etc/lsaai-mock-tmpl
TEMPLATE_CLIENT_DIR=/etc/lsaai-mock/client-templates
CONF_FILETREE=/etc/lsaai-mock
CONF_CLIENT_DIR=/etc/lsaai-mock/clients
BROKER_TEMPLATE_FILE=/etc/lsaai-mock/ga4gh-broker/application.yaml.tmpl
BROKER_CONF_FILE=/etc/lsaai-mock/ga4gh-broker/application.yaml

cp -r $TEMPLATE_FILETREE/* $CONF_FILETREE/

# build mock client configurations from templates
echo "Processing Go templates for Mock client configurations"
for f in `find $CONF_CLIENT_DIR -name "*.tmpl"`; do
  name=$(basename "$f" .tmpl)
  echo "Processing template $f"
  gomplate -f "$f" -o "$CONF_DIR/$name" && cat "$CONF_DIR/$name" || exit 1
done

# build mock broker configuration from template
echo "Processing Go templates for Broker configuration"
gomplate -f "$BROKER_TEMPLATE_FILE" -o "$BROKER_CONF_FILE" && cat "$BROKER_CONF_FILE" || exit 1

echo "Go template processing completed. Starting Mock AAI server"

# run tomcat server with mock aai app
catalina.sh run
