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

> Le remote `local` ne couvre pas les spécificités S3/R2 (endpoint, clés), mais
> valide toute la chaîne pg_dump↔pg_restore et le chiffrement.

## Exercice sur la sauvegarde RÉELLE

`test-restore.sh` prouve le mécanisme sur des données factices. Il ne dit rien de
ce qui dort réellement sur R2. C'est le rôle de :

```sh
./infra/backup/drill-restore-prod.sh          # dernier dump
./infra/backup/drill-restore-prod.sh encre-20260801T030000Z.dump.gpg   # un dump précis
```

Il récupère le dump sur R2 (**lecture seule**), le restaure dans un cluster jetable
— ni la prod ni la stack locale ne sont touchées — puis affiche ce qu'il contient :
nombre de pages, articles, offres, messages, abonnés, et un échantillon du texte
éditorial. Tant qu'on n'a pas vu du contenu réel ressortir d'un dump réel, on n'a
pas de sauvegarde : on a un fichier. À rejouer après tout changement de schéma ou
de rôles.

### Le piège des privilèges par défaut

Un dump référence le **superutilisateur de la source** dans ses
`ALTER DEFAULT PRIVILEGES`. Si ce rôle n'existe pas dans le cluster cible,
`pg_restore` rejette ces instructions une par une : la structure et les données
passent, **les privilèges par défaut non**. Le symptôme est discret — un
`errors ignored on restore: N` en fin de sortie. Le script crée donc le rôle au
préalable (`SOURCE_POSTGRES_USER`, défaut `postgres_encre`). En restauration
prod → prod, le rôle existe déjà et l'étape est sans effet.

**Dernier exercice** : 2026-08-03, dump du jour — 18 collections, 6 articles publiés,
5 offres, 9 messages, 3 abonnés, contenu éditorial intact.
