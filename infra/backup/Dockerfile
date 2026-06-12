# Image de sauvegarde — docs/07-deploy.md §6.
# Base = même version Postgres que le serveur (pg_dump/pg_restore doivent
# correspondre au cluster source). + rclone (→ R2), gnupg (chiffrement),
# coreutils (date GNU pour le calcul de semaine ISO de la rétention).
FROM postgres:17.6-alpine

RUN apk add --no-cache rclone gnupg coreutils

COPY lib.sh /usr/local/lib/backup/lib.sh
COPY backup.sh restore.sh entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/backup.sh /usr/local/bin/restore.sh /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
