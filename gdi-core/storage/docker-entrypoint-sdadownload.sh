#!/bin/bash
# build ISS config from template
echo "Processing Go templates for Broker configuration"
gomplate -f "/iss.json.tmpl" -o "/iss.json" && cat "/iss.json" || exit 1

echo "Go template processing completed. Starting SDA download server"

# run main app
sda-download
