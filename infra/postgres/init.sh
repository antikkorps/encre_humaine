#!/bin/sh
# Wrapper d'init Postgres — injecte les mots de passe des rôles depuis l'env
# vers init.sql (variables psql). Seul CE script est dans docker-entrypoint-initdb.d ;
# init.sql est monté hors initdb.d pour ne pas être exécuté sans variables.
set -eu

psql -v ON_ERROR_STOP=1 \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  -v app_pw="$APP_DB_PASSWORD" \
  -v directus_pw="$DIRECTUS_DB_PASSWORD" \
  -v umami_pw="$UMAMI_DB_PASSWORD" \
  -f /opt/encre/init.sql

echo "[init] schémas app/directus/umami + rôles cloisonnés créés."
