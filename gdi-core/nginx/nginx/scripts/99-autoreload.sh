#!/bin/bash

# Script to reload nginx in case certs change

while :; do
    # Optional: Instead of sleep, detect config changes and only reload if necessary.
    #sleep 6h
    sleep 7h
    echo "$0: Reloading Nginx configuration..."
    nginx -t && nginx -s reload
done &

