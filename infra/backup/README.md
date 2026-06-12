# Sauvegardes Postgres → R2

Sauvegardes chiffrées de la base applicative (schémas `app` / `directus` / `umami`)
vers Cloudflare R2, avec rétention et restauration testée — `docs/07-deploy.md` §6,
critère d'acceptation #6.

## Principe

```
pg_dump -Fc  |  gpg AES256 (symétrique)  |  rclone  →  R2 (R2_BUCKET_BACKUPS)
```

- **Conteneur cron** (`backup` dans `docker-compose.yml`) : exécute `backup.sh`
  selon `BACKUP_CRON` (défaut `0 3 * * *`, UTC).
- **Chiffrement** : GPG symétrique AES256, passphrase `BACKUP_PASSPHRASE`.
  ⚠️ Sans cette passphrase, les sauvegardes sont **irrécupérables** — la conserver
  hors de l'hôte (gestionnaire de secrets).
- **Remote rclone** : défini entièrement par variables d'environnement (aucun
  fichier de conf). Remote `r2` = S3 Cloudflare. Surchargeable via
  `BACKUP_RCLONE_REMOTE` (utilisé en test, cf. plus bas).
- **Rétention GFS-lite** (`backup.sh`) : conserve les `BACKUP_KEEP_DAILY` (7)
  sauvegardes les plus récentes + une par semaine ISO sur `BACKUP_KEEP_WEEKLY`
  (4) semaines distinctes ; supprime le reste.

## Variables

| Variable | Rôle |
|---|---|
| `POSTGRES_HOST/PORT/DB/USER/PASSWORD` | accès cluster source (superuser) |
| `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_BACKUPS` | cible R2 |
| `BACKUP_PASSPHRASE` | clé de chiffrement GPG |
| `BACKUP_CRON` | planification (UTC) |
| `BACKUP_KEEP_DAILY` / `BACKUP_KEEP_WEEKLY` | rétention |

## Usage

```sh
make backup-build           # construit l'image
make backup-run             # sauvegarde immédiate (hors planning)
make restore NAME=latest    # restaure la dernière sauvegarde dans $POSTGRES_DB
make restore NAME=encre-20260612T030000Z.dump.gpg
```

La cible de restauration **doit** être un cluster initialisé par `init.sql`
(les rôles `app_user`/`directus_user`/`umami_user` doivent exister : le dump
restaure propriétaires et GRANTs).

## Test de restauration (critère #6)

Le cycle complet **dump → chiffrement → rclone → déchiffrement → pg_restore** est
vérifié de bout en bout par `infra/backup/test-restore.sh`, qui :

1. monte un Postgres source (init `init.sql` + table sentinelle dans `app`) ;
2. lance `backup.sh` (remote rclone `local` → un volume, pas besoin de R2) ;
3. monte un Postgres cible **vierge** (init `init.sql`) ;
4. lance `restore.sh` dessus ;
5. vérifie que la ligne sentinelle est bien restaurée dans le schéma `app`.

```sh
./infra/backup/test-restore.sh
```

> Le remote `local` ne couvre pas les spécificités S3/R2 (endpoint, clés) — non
> testables sans bucket réel —, mais valide toute la chaîne pg_dump↔pg_restore et
> le chiffrement. Le câblage R2 réel relève de l'étape déploiement (secrets).
