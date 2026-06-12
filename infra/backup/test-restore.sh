#!/usr/bin/env bash
# Test de restauration de bout en bout — docs/07-deploy.md §6 (critère #6).
# Prouve le cycle pg_dump → gpg → rclone → déchiffrement → pg_restore sur deux
# clusters jetables, sans toucher au dev ni à R2 (remote rclone "local").
#
#   dump(source) → /backups/encre-*.dump.gpg → restore(cible vierge) → vérif
#
# Idempotent et auto-nettoyé (trap). Usage : ./infra/backup/test-restore.sh
set -euo pipefail

NET=encre-backuptest-net
VOL=encre-backuptest-vol
SRC=encre-backuptest-src
DST=encre-backuptest-dst
IMG=encre/backup:test
HERE="$(cd "$(dirname "$0")" && pwd)"
PG_IMAGE=postgres:17.6-alpine

PASS="test-passphrase-not-a-secret"
PGPW=srcpass
APPPW=apppass
DIRPW=dirpass
UMAPW=umapass

cleanup() {
  docker rm -f "$SRC" "$DST" >/dev/null 2>&1 || true
  docker volume rm "$VOL" >/dev/null 2>&1 || true
  docker network rm "$NET" >/dev/null 2>&1 || true
}
trap cleanup EXIT
cleanup

echo "== build image de sauvegarde =="
docker build -q -t "$IMG" "$HERE" >/dev/null

docker network create "$NET" >/dev/null
docker volume create "$VOL" >/dev/null

# init.sh attend POSTGRES_USER/DB + les 3 mots de passe de rôles ; on monte
# init.sh (initdb.d) + init.sql (hors initdb.d, comme en prod).
start_pg() {
  local name="$1"
  docker run -d --name "$name" --network "$NET" \
    -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD="$PGPW" -e POSTGRES_DB=encre \
    -e APP_DB_PASSWORD="$APPPW" -e DIRECTUS_DB_PASSWORD="$DIRPW" -e UMAMI_DB_PASSWORD="$UMAPW" \
    -v "$HERE/../postgres/init.sh:/docker-entrypoint-initdb.d/10-init.sh:ro" \
    -v "$HERE/../postgres/init.sql:/opt/encre/init.sql:ro" \
    "$PG_IMAGE" >/dev/null
}

wait_pg() {
  local name="$1"
  for _ in $(seq 1 30); do
    if docker exec "$name" pg_isready -U postgres -d encre >/dev/null 2>&1; then return 0; fi
    sleep 1
  done
  echo "!! $name n'est pas prêt" >&2; docker logs "$name" >&2; exit 1
}

echo "== cluster source =="
start_pg "$SRC"; wait_pg "$SRC"
# Donnée sentinelle dans le schéma app (prouve la restauration du contenu app).
docker exec -e PGPASSWORD="$PGPW" "$SRC" psql -U postgres -d encre -v ON_ERROR_STOP=1 -c \
  "CREATE TABLE app.sentinel (id int primary key, note text); INSERT INTO app.sentinel VALUES (42, 'encre-humaine');" >/dev/null
echo "   sentinelle insérée (app.sentinel = 42)"

# Variables communes aux conteneurs backup/restore : remote rclone LOCAL.
RCLONE_ENV=(
  -e BACKUP_RCLONE_REMOTE=local -e RCLONE_CONFIG_LOCAL_TYPE=local
  -e R2_BUCKET_BACKUPS=/backups
  -e BACKUP_PASSPHRASE="$PASS"
  -e POSTGRES_PORT=5432 -e POSTGRES_DB=encre -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD="$PGPW"
)

echo "== sauvegarde (source) =="
docker run --rm --network "$NET" -v "$VOL:/backups" \
  "${RCLONE_ENV[@]}" -e POSTGRES_HOST="$SRC" \
  --entrypoint /usr/local/bin/backup.sh "$IMG"

echo "   contenu de /backups :"
docker run --rm -v "$VOL:/backups" "$PG_IMAGE" ls -1 /backups | sed 's/^/   - /'

echo "== cluster cible (vierge) =="
start_pg "$DST"; wait_pg "$DST"

echo "== restauration (cible) =="
docker run --rm --network "$NET" -v "$VOL:/backups" \
  "${RCLONE_ENV[@]}" -e POSTGRES_HOST="$DST" \
  --entrypoint /usr/local/bin/restore.sh "$IMG" latest

echo "== vérification =="
GOT=$(docker exec -e PGPASSWORD="$PGPW" "$DST" psql -U postgres -d encre -tAc \
  "SELECT note FROM app.sentinel WHERE id = 42;")
if [ "$GOT" = "encre-humaine" ]; then
  echo "✅ OK : la sentinelle a été restaurée (note='$GOT')."
else
  echo "❌ ÉCHEC : valeur restaurée = '$GOT' (attendu 'encre-humaine')." >&2
  exit 1
fi

# Bonus : app_user peut lire la table restaurée (GRANTs/owners préservés).
APPGOT=$(docker exec -e PGPASSWORD="$APPPW" "$DST" psql -U app_user -d encre -tAc \
  "SELECT count(*) FROM app.sentinel;" 2>/dev/null || echo "ERR")
echo "   app_user lit app.sentinel → ${APPGOT} ligne(s)"
echo "✅ Test de restauration complet."
