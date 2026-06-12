#!/bin/sh
# Sauvegarde chiffrée Postgres → R2 — docs/07-deploy.md §6.
# pg_dump (format custom, compressé) | gpg (AES256 symétrique) → rclone → R2,
# puis rétention GFS-lite (N quotidiens + N hebdomadaires).
set -eu

# Exécution par cron : l'env du conteneur est persisté par l'entrypoint
# (busybox crond ne transmet qu'un env minimal aux jobs).
[ -f /usr/local/etc/backup.env ] && . /usr/local/etc/backup.env
. /usr/local/lib/backup/lib.sh

require_common_env
configure_rclone

KEEP_DAILY="${BACKUP_KEEP_DAILY:-7}"
KEEP_WEEKLY="${BACKUP_KEEP_WEEKLY:-4}"
DEST="${REMOTE}:${R2_BUCKET_BACKUPS}"

ts=$(date -u +%Y%m%dT%H%M%SZ)
file="encre-${ts}.dump.gpg"
tmp="/tmp/${file}"

echo "[backup] dump ${POSTGRES_DB:-encre}@${POSTGRES_HOST} → ${file}"
export PGPASSWORD="$POSTGRES_PASSWORD"
# -Fc : format custom (compressé, restaurable sélectivement). Dump complet du
# cluster applicatif (schémas app/directus/umami) en superuser.
pg_dump -Fc -h "$POSTGRES_HOST" -p "${POSTGRES_PORT:-5432}" -U "$POSTGRES_USER" "${POSTGRES_DB:-encre}" \
  | gpg --batch --yes --symmetric --cipher-algo AES256 \
        --passphrase "$BACKUP_PASSPHRASE" -o "$tmp"

echo "[backup] upload → ${DEST}/${file}"
rclone copyto "$tmp" "${DEST}/${file}"
rm -f "$tmp"

# ── Rétention GFS-lite ──────────────────────────────────────────────────────
# Conserve les KEEP_DAILY plus récents + un par semaine ISO sur KEEP_WEEKLY
# semaines distinctes ; supprime le reste. Les noms ISO triés = ordre chrono.
all=$(rclone lsf "$DEST" --include "encre-*.dump.gpg" | sort -r)
keep=$(mktemp)
printf '%s\n' "$all" | grep -v '^$' | head -n "$KEEP_DAILY" > "$keep"

seen=""
weeks=0
for f in $all; do
  ymd=$(printf '%s' "$f" | sed -n 's/^encre-\([0-9]\{8\}\)T.*/\1/p')
  [ -n "$ymd" ] || continue
  iso=$(printf '%s' "$ymd" | sed -E 's/(....)(..)(..)/\1-\2-\3/')
  wk=$(date -u -d "$iso" +%G%V 2>/dev/null) || continue
  case " $seen " in *" $wk "*) continue ;; esac
  seen="$seen $wk"
  weeks=$((weeks + 1))
  echo "$f" >> "$keep"
  [ "$weeks" -ge "$KEEP_WEEKLY" ] && break
done
sort -u "$keep" -o "$keep"

for f in $all; do
  [ -n "$f" ] || continue
  if ! grep -qxF "$f" "$keep"; then
    echo "[backup] rétention : suppression ${f}"
    rclone deletefile "${DEST}/${f}"
  fi
done
rm -f "$keep"
echo "[backup] terminé."
