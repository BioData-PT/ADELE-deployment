#!/bin/bash

TEMPLATE_DIR=/etc/lsaai-mock/client-templates
CONF_DIR=/etc/lsaai-mock/clients
BROKER_TEMPLATE_FILE=/etc/lsaai-mock/ga4gh-broker/application.yaml.tmpl
BROKER_CONF_FILE=/etc/lsaai-mock/ga4gh-broker/application.yaml

# build mock configurations from templates
echo "Processing Go templates for Mock configurations"
for f in `find $TEMPLATE_DIR -name "*.tmpl"`; do
  name=$(basename "$f" .tmpl)
  echo "Processing template $f"
  gomplate -f "$f" -o "$CONF_DIR/$name" && cat "$CONF_DIR/$name" || exit 1
done

# build mock configurations from templates
echo "Processing Go templates for Broker configuration"
gomplate -f "$BROKER_TEMPLATE_FILE" -o "$BROKER_CONF_FILE" && cat "$BROKER_CONF_FILE" || exit 1

echo "Go template processing completed. Starting Mock AAI server"

# run tomcat server with mock aai app
catalina.sh run