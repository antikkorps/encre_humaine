#!/bin/sh
# Restauration d'une sauvegarde chiffrée — docs/07-deploy.md §6 (critère #6).
# Usage : restore.sh [nom-fichier|latest] [db_cible]
#   - nom-fichier : "encre-YYYYMMDDThhmmssZ.dump.gpg" ou "latest" (défaut).
#   - db_cible    : base de destination (défaut : $POSTGRES_DB).
# La cible DOIT être un cluster initialisé par init.sql (rôles app_user/
# directus_user/umami_user présents) : le dump restaure propriétaires & GRANTs.
set -eu

[ -f /usr/local/etc/backup.env ] && . /usr/local/etc/backup.env
. /usr/local/lib/backup/lib.sh

require_common_env
configure_rclone

name="${1:-latest}"
target_db="${2:-${POSTGRES_DB:-encre}}"
DEST="${REMOTE}:${R2_BUCKET_BACKUPS}"

if [ "$name" = "latest" ]; then
  name=$(rclone lsf "$DEST" --include "encre-*.dump.gpg" | sort -r | head -n1)
  [ -n "$name" ] || { echo "[restore] aucune sauvegarde trouvée dans ${DEST}." >&2; exit 1; }
fi

echo "[restore] récupération ${name}"
rclone copyto "${DEST}/${name}" "/tmp/${name}"
gpg --batch --yes --decrypt --passphrase "$BACKUP_PASSPHRASE" \
  -o /tmp/restore.dump "/tmp/${name}"

echo "[restore] pg_restore → ${target_db}@${POSTGRES_HOST}"
export PGPASSWORD="$POSTGRES_PASSWORD"
# --clean --if-exists : remet la base dans l'état du dump (drop+recreate des
# objets) sans échouer si absents. Exécuté en superuser.
pg_restore --clean --if-exists \
  -h "$POSTGRES_HOST" -p "${POSTGRES_PORT:-5432}" -U "$POSTGRES_USER" \
  -d "$target_db" /tmp/restore.dump

rm -f "/tmp/${name}" /tmp/restore.dump
echo "[restore] terminé."
