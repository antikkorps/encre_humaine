#!/bin/sh
# Fonctions communes aux scripts backup/restore — docs/07-deploy.md §6.
# Source unique de la config rclone (DRY) : aucun fichier de conf, tout par env.

# Configure le remote rclone. Par défaut "r2" (S3 Cloudflare via les variables
# R2_*). Surchargeable via BACKUP_RCLONE_REMOTE (ex. "local" en test : on attend
# alors que RCLONE_CONFIG_LOCAL_TYPE=local soit fourni par l'appelant).
configure_rclone() {
  REMOTE="${BACKUP_RCLONE_REMOTE:-r2}"
  if [ "$REMOTE" = "r2" ]; then
    : "${R2_ACCESS_KEY_ID:?R2_ACCESS_KEY_ID requis}"
    : "${R2_SECRET_ACCESS_KEY:?R2_SECRET_ACCESS_KEY requis}"
    : "${R2_ENDPOINT:?R2_ENDPOINT requis}"
    export RCLONE_CONFIG_R2_TYPE=s3
    export RCLONE_CONFIG_R2_PROVIDER=Cloudflare
    export RCLONE_CONFIG_R2_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
    export RCLONE_CONFIG_R2_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
    export RCLONE_CONFIG_R2_ENDPOINT="$R2_ENDPOINT"
    export RCLONE_CONFIG_R2_REGION=auto
    # R2 ne supporte pas HeadBucket comme S3 → évite un appel qui échoue.
    export RCLONE_CONFIG_R2_NO_CHECK_BUCKET=true
  fi
}

# Vérifie les variables requises par tout job (dump comme restore).
require_common_env() {
  : "${POSTGRES_HOST:?POSTGRES_HOST requis}"
  : "${POSTGRES_USER:?POSTGRES_USER requis}"
  : "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD requis}"
  : "${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE requis}"
  : "${R2_BUCKET_BACKUPS:?R2_BUCKET_BACKUPS requis}"
}
