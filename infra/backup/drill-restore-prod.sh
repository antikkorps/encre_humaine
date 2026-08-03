#!/usr/bin/env bash
# EXERCICE DE RESTAURATION — docs/07-deploy.md §6.
#
# `test-restore.sh` prouve le MÉCANISME sur des données jetables. Celui-ci prouve
# la SAUVEGARDE RÉELLE : il récupère le dernier dump de prod sur R2, le restaure
# dans un cluster jetable et affiche ce qu'il contient. Tant qu'on n'a pas vu du
# contenu réel ressortir d'un dump réel, on n'a pas de sauvegarde : on a un fichier.
#
# Ne touche ni la prod (lecture seule sur R2), ni la stack locale (cluster dédié,
# supprimé à la sortie). Secrets lus dans infra/env/.env, jamais affichés.
#
#   ./infra/backup/drill-restore-prod.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
NET=encre-proddump-net
DST=encre-proddump-dst
IMG=encre/backup:test
PGPW=dstpass

cleanup() {
  docker rm -f "$DST" >/dev/null 2>&1 || true
  docker network rm "$NET" >/dev/null 2>&1 || true
}
trap cleanup EXIT
cleanup

# Secrets R2 + passphrase depuis l'env du projet (jamais affichés).
# Lecture stricte KEY=VALUE : le fichier contient des commentaires en français
# avec des apostrophes, qu'un `source` interpréterait comme du shell.
while IFS= read -r line; do
  case "$line" in
    R2_ENDPOINT=*|R2_ACCESS_KEY_ID=*|R2_SECRET_ACCESS_KEY=*|R2_BUCKET_BACKUPS=*|BACKUP_PASSPHRASE=*)
      export "${line%%=*}=${line#*=}" ;;
  esac
done < "$ROOT/infra/env/.env"

echo "== cluster cible jetable =="
docker network create "$NET" >/dev/null
docker run -d --name "$DST" --network "$NET" \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD="$PGPW" -e POSTGRES_DB=encre \
  -e APP_DB_PASSWORD=x -e DIRECTUS_DB_PASSWORD=y -e UMAMI_DB_PASSWORD=z \
  -v "$ROOT/infra/postgres/init.sh:/docker-entrypoint-initdb.d/10-init.sh:ro" \
  -v "$ROOT/infra/postgres/init.sql:/opt/encre/init.sql:ro" \
  postgres:18.3-alpine >/dev/null

for i in $(seq 1 40); do
  docker exec "$DST" pg_isready -U postgres -d encre >/dev/null 2>&1 && break
  sleep 2
done

# Le dump référence le SUPERUTILISATEUR DE LA SOURCE dans ses ALTER DEFAULT
# PRIVILEGES. Si ce rôle n'existe pas dans le cluster cible, pg_restore rejette
# ces instructions une à une (« role does not exist ») : la structure et les
# données passent, mais les privilèges par défaut NON — un piège silencieux en
# situation réelle. On le crée donc avant de restaurer. En restauration de prod
# vers prod, le rôle existe déjà et cette étape est sans effet.
SRC_SUPERUSER="${SOURCE_POSTGRES_USER:-postgres_encre}"
docker exec -e PGPASSWORD="$PGPW" "$DST" psql -U postgres -d encre -q -c \
  "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='$SRC_SUPERUSER') THEN CREATE ROLE $SRC_SUPERUSER SUPERUSER LOGIN; END IF; END \$\$;"

echo "== restauration du dernier dump de prod =="
docker run --rm --network "$NET" \
  -e POSTGRES_HOST="$DST" -e POSTGRES_PORT=5432 -e POSTGRES_DB=encre \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD="$PGPW" \
  -e R2_ENDPOINT="$R2_ENDPOINT" -e R2_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
  -e R2_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" -e R2_BUCKET_BACKUPS="$R2_BUCKET_BACKUPS" \
  -e BACKUP_PASSPHRASE="$BACKUP_PASSPHRASE" \
  --entrypoint /usr/local/bin/restore.sh "$IMG" "${1:-latest}" 2>&1 | grep -viE "NOTICE|^$" | tail -8 || true

echo
echo "== ce que contient la sauvegarde =="
docker exec -e PGPASSWORD="$PGPW" "$DST" psql -U postgres -d encre -tA -c "
select 'pages Directus       : ' || count(*) from directus.directus_collections
union all select 'articles publiés     : ' || count(*) from directus.articles where status='published'
union all select 'offres               : ' || count(*) from directus.offers
union all select 'messages formulaire  : ' || count(*) from app.contact_leads
union all select 'abonnés newsletter   : ' || count(*) from app.newsletter_subscribers;"

echo
echo "== contenu d'Éléonore (échantillon) =="
docker exec -e PGPASSWORD="$PGPW" "$DST" psql -U postgres -d encre -tA -c "
select 'accueil  : ' || coalesce(left(hero_title,60),'(vide)') from directus.home_page
union all select 'à propos : ' || coalesce(left(accroche_title,60),'(vide)') from directus.about_page
union all select 'labo     : ' || coalesce(left(title,40),'(vide)') || ' / ' || coalesce(left(intro,40),'(vide)') from directus.shop_page
union all select 'contact  : ' || coalesce(left(accroche_title,60),'(vide)') from directus.contact_page;"
