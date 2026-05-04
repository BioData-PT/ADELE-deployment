.PHONY: ps
include .env
SHELL := /bin/bash

ps:
	@docker compose ps -a --format 'table {{.Service}}\t{{.CreatedAt}}\t{{.Status}}'

get-cert:
	@BASH_ENV=.env bash ./gdi-core/nginx/get_cert.sh

clean-certs:
	# erase certbot certificates and challenges
	@rm -rf gdi-core/nginx/certbot/{conf,www}/*

