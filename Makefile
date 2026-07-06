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
# Port d'exposition Directus sur l'hôte (dev uniquement, cf. overlay).
HOST_DIRECTUS_PORT ?= 8055
export HOST_DIRECTUS_PORT

.DEFAULT_GOAL := help
.PHONY: help env db-up db-down db-migrate psql psql-app query ps logs db-reset down clean \
        cms-up cms-down cms-logs cms-bootstrap cms-snapshot cms-apply cms-types cms-seed \
        backup-build backup-run restore \
        prod-deploy prod-up prod-cms-recreate prod-ps prod-logs prod-umami-reset prod-backup prod-backup-logs

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

# ── Directus (CMS) ───────────────────────────────────────────────────────────
cms-up: $(ENV_FILE) ## Démarre Postgres + Directus (API sur 127.0.0.1:$(HOST_DIRECTUS_PORT))
	$(COMPOSE) up -d --wait postgres directus
	@echo "→ Directus prêt sur http://127.0.0.1:$(HOST_DIRECTUS_PORT)."

cms-down: ## Stoppe Directus (conserve les données)
	$(COMPOSE) stop directus

cms-logs: ## Logs Directus (suivi)
	$(COMPOSE) logs -f directus

cms-bootstrap: cms-up ## Crée/maj collections, champs, relations, rôles & permissions (idempotent)
	pnpm --filter @encre/directus bootstrap

cms-snapshot: cms-up ## Exporte le schéma Directus → packages/directus/snapshots/schema.yaml
	pnpm --filter @encre/directus snapshot

cms-apply: cms-up ## Rejoue le snapshot de schéma sur l'instance courante
	pnpm --filter @encre/directus apply

cms-types: ## Génère les types TS du schéma depuis le snapshot (sans Docker)
	pnpm --filter @encre/directus types

cms-seed: cms-up ## Injecte du contenu DÉMO (FR) pour travailler la mise en page (idempotent)
	pnpm --filter @encre/directus bootstrap
	pnpm --filter @encre/directus seed

# ── Sauvegardes (pg_dump chiffré → R2) ───────────────────────────────────────
backup-build: $(ENV_FILE) ## Construit l'image de sauvegarde
	$(COMPOSE) build backup

backup-run: db-up ## Lance une sauvegarde immédiate (pg_dump chiffré → R2)
	$(COMPOSE) run --rm --entrypoint /usr/local/bin/backup.sh backup

restore: db-up ## Restaure une sauvegarde — make restore NAME=latest (ou encre-...dump.gpg)
	$(COMPOSE) run --rm --entrypoint /usr/local/bin/restore.sh backup "$(or $(NAME),latest)"

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

# ── Production — à lancer SUR le serveur Hetzner (en root, dans /srv/encre-humaine) ──
# La prod n'utilise QUE docker-compose.yml (pas l'overlay dev). Ces cibles évitent
# de taper la longue commande compose à la main (terminaux qui coupent les lignes).
PROD_COMPOSE := docker compose --env-file $(ENV_FILE) -f infra/docker-compose.yml

prod-deploy: ## PROD : git pull (user deploy) + rebuild + attente healthchecks
	sudo -u deploy -H git -C $(CURDIR) fetch --all --prune
	sudo -u deploy -H git -C $(CURDIR) reset --hard origin/main
	$(PROD_COMPOSE) up -d --build --wait
	$(PROD_COMPOSE) ps

prod-up: ## PROD : rebuild + relance (sans git pull)
	$(PROD_COMPOSE) up -d --build --wait
	$(PROD_COMPOSE) ps

prod-cms-recreate: ## PROD : recrée le conteneur Directus (rafraîchit le cache de schéma)
	$(PROD_COMPOSE) up -d --force-recreate --wait directus
	$(PROD_COMPOSE) ps

prod-ps: ## PROD : état des conteneurs
	$(PROD_COMPOSE) ps

prod-logs: ## PROD : logs en suivi — ex: make prod-logs S=web
	$(PROD_COMPOSE) logs -f $(S)

prod-umami-reset: ## PROD : repart d'un schéma umami vierge (corrige l'état prisma cassé)
	$(PROD_COMPOSE) stop umami
	$(PROD_COMPOSE) exec -T postgres sh -c \
	  'psql -v ON_ERROR_STOP=1 -U "$$POSTGRES_USER" -d "$$POSTGRES_DB" \
	   -c "DROP SCHEMA IF EXISTS umami CASCADE; CREATE SCHEMA umami AUTHORIZATION umami_user; CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA umami;"'
	$(PROD_COMPOSE) up -d --wait umami || $(PROD_COMPOSE) ps

prod-backup: ## PROD : sauvegarde immédiate (pg_dump chiffré → R2) — vérifie la chaîne
	$(PROD_COMPOSE) run --rm --entrypoint /usr/local/bin/backup.sh backup

prod-backup-logs: ## PROD : logs du conteneur backup (cron) — confirme la planification
	$(PROD_COMPOSE) logs --tail 50 backup
