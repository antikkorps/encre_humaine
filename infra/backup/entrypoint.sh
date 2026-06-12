#!/bin/sh
# Entrypoint du conteneur backup — planifie pg_dump via cron — docs/07 §6.
set -eu

mkdir -p /usr/local/etc
# busybox crond ne donne qu'un env minimal aux jobs : on persiste les variables
# utiles pour que backup.sh les retrouve (quoting sûr via `export -p`).
export -p | grep -E '^export (POSTGRES_|R2_|BACKUP_|RCLONE_)' > /usr/local/etc/backup.env || true

CRON="${BACKUP_CRON:-0 3 * * *}"
# Sortie des jobs → stdout/stderr du conteneur (PID 1 = crond après exec).
echo "${CRON} /usr/local/bin/backup.sh >> /proc/1/fd/1 2>> /proc/1/fd/2" > /etc/crontabs/root
echo "[backup] cron planifié : ${CRON} (UTC)"

exec crond -f -l 8
