# ── L'Encre Humaine — raccourcis dev (Docker / Postgres) ─────────────────────
# Tout passe par la stack Docker (docs/07-deploy.md). La prod n'utilise QUE
# docker-compose.yml ; ici on ajoute l'overlay dev (port Postgres exposé en local).
# Cibles principales : `make db-up` puis `make psql` (ou `make psql-app`).

ENV_FILE  := infra/env/.env
COMPOSE   := docker compose --env-file $(ENV_FILE) -f infra/docker-compose.yml -f infra/docker-compose.dev.yml
# Port d'exposition Postgres sur l'hôte (override possible : make db-up HOST_PG_PORT=5544).
# 55432 par défaut pour ne pas entrer en conflit avec un Postgres local sur 5432.
# `export` pour que docker compose (overlay dev) le voie aussi.
HOST_PG_PORT ?= 55432
export HOST_PG_PORT

.DEFAULT_GOAL := help
.PHONY: help env db-up db-down db-migrate psql psql-app query ps logs db-reset down clean

help: ## Liste les cibles
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

# Crée infra/env/.env depuis l'exemple si absent (valeurs change-me OK en local).
$(ENV_FILE):
	cp $(ENV_FILE).example $(ENV_FILE)
	@echo "→ $(ENV_FILE) créé depuis l'exemple. Édite les secrets si besoin."

env: $(ENV_FILE) ## Crée infra/env/.env si absent

db-up: $(ENV_FILE) ## Démarre Postgres (attend qu'il soit healthy)
	$(COMPOSE) up -d --wait postgres
	@echo "→ Postgres prêt sur 127.0.0.1:$(HOST_PG_PORT)."

db-down: ## Stoppe Postgres (conserve les données / volume)
	$(COMPOSE) stop postgres

db-migrate: db-up ## Applique les migrations Drizzle (depuis l'hôte, en superuser)
	@U=$$(grep -E '^POSTGRES_USER=' $(ENV_FILE) | cut -d= -f2-); \
	 P=$$(grep -E '^POSTGRES_PASSWORD=' $(ENV_FILE) | cut -d= -f2-); \
	 D=$$(grep -E '^POSTGRES_DB=' $(ENV_FILE) | cut -d= -f2-); \
	 APP_DATABASE_URL="postgres://$$U:$$P@127.0.0.1:$(HOST_PG_PORT)/$$D?search_path=app" \
	   pnpm --filter @encre/db db:migrate

psql: ## Ouvre un shell psql (superuser) dans le conteneur
	$(COMPOSE) exec postgres sh -c 'PGPASSWORD=$$POSTGRES_PASSWORD psql -U $$POSTGRES_USER -d $$POSTGRES_DB'

psql-app: ## Ouvre un shell psql en tant qu'app_user (search_path=app) — manip data app
	$(COMPOSE) exec postgres sh -c 'PGPASSWORD=$$APP_DB_PASSWORD psql -U app_user -d $$POSTGRES_DB'

query: ## Exécute une requête SQL ponctuelle en app_user — ex: make query Q="select * from orders;"
	$(COMPOSE) exec -T postgres sh -c 'PGPASSWORD=$$APP_DB_PASSWORD psql -U app_user -d $$POSTGRES_DB -c "$(Q)"'

ps: ## État des conteneurs
	$(COMPOSE) ps

logs: ## Logs Postgres (suivi)
	$(COMPOSE) logs -f postgres

db-reset: $(ENV_FILE) ## DANGER : détruit le volume Postgres puis recrée (init.sql + migrations)
	@printf "⚠️  Supprime TOUTES les données Postgres. Continuer ? [y/N] "; \
	read ans; [ "$$ans" = "y" ] || { echo "Annulé."; exit 1; }
	$(COMPOSE) down -v
	$(MAKE) db-migrate

down: ## Stoppe toute la stack (conserve les volumes)
	$(COMPOSE) down

clean: ## DANGER : stoppe la stack ET supprime les volumes (perte de données)
	@printf "⚠️  Supprime tous les volumes (Postgres, Caddy). Continuer ? [y/N] "; \
	read ans; [ "$$ans" = "y" ] || { echo "Annulé."; exit 1; }
	$(COMPOSE) down -v
