.PHONY: ps

ps:
	@docker compose ps -a --format 'table {{.Service}}\t{{.CreatedAt}}\t{{.Status}}'

