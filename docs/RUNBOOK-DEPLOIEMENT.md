# Runbook — Déploiement L'Encre Humaine

Guide opérationnel pas-à-pas pour mettre `encrehumaine.fr` en production sur
Hetzner. Complète (sans dupliquer) le **spec** `docs/07-deploy.md` et le **setup
CI** `.forgejo/workflows/README.md`.

**Principe retenu** (décisions actées) :
- **Build sur le serveur** (pas de registry d'images).
- **`.env` maintenu à la main** sur l'hôte — la CI n'y touche jamais.
- **Déploiement manuel** : tag `v*` poussé, ou bouton « Run workflow » (Forgejo).
- **Cloudflare en mode ORANGE** (proxifié) → firewall origine recommandé.

> Convention : `▢` = action à faire ; `✅` = vérification attendue.

---

## Phase 0 — Pré-requis (comptes & accès)

Déjà en place : Hetzner, Cloudflare, domaine
`encrehumaine.fr`, Resend, Cal.com (`BOOKING_URL` réel), miroir GitHub. Restent
à finaliser au déploiement :

- ▢ **Stripe en mode LIVE** (produits/prix/shipping rate/webhook) — Phase 7.
- ▢ **Identité légale** : SIRET, adresse, médiateur conso… (marqueurs
  `[À COMPLÉTER]` du seed + `site_settings`) — Phase 6.
- ▢ **Secrets internes à générer** — Phase 1.

---

## Phase 1 — Générer les secrets

Tous vont dans `infra/env/.env` sur le serveur (Phase 4). Générer des valeurs
fortes :

```sh
openssl rand -hex 32   # pour chaque secret « interne »
```

| Variable | Source / comment |
|---|---|
| `POSTGRES_PASSWORD`, `APP_DB_PASSWORD`, `DIRECTUS_DB_PASSWORD`, `UMAMI_DB_PASSWORD` | aléatoires (openssl) ; reportés dans les `*_DB_URL` |
| `APP_DATABASE_URL`, `DIRECTUS_DB_URL`, `UMAMI_DB_URL` | DSN cohérents avec les mots de passe ci-dessus + `POSTGRES_HOST=postgres` |
| `DIRECTUS_KEY`, `DIRECTUS_SECRET`, `UMAMI_APP_SECRET` | aléatoires |
| `DIRECTUS_ADMIN_EMAIL` = `admin@encrehumaine.fr`, `DIRECTUS_ADMIN_PASSWORD` | admin du CMS (créé au 1er boot, volume neuf) |
| `DIRECTUS_READ_TOKEN` | aléatoire **fixé AVANT le bootstrap** (le bootstrap crée l'utilisateur API lecture-seule avec CE token) |
| `DIRECTUS_EDITOR_EMAIL` = `eleonore@encrehumaine.fr`, `DIRECTUS_EDITOR_PASSWORD` | compte éditrice (Eléonore) créé par le bootstrap ; mot de passe **initial** (elle le change à la 1re connexion) |
| `STRIPE_SECRET_KEY` (`sk_live_…`), `STRIPE_WEBHOOK_SECRET` (`whsec_…`), `STRIPE_SHIPPING_RATE_FR` (`shr_…`) | Stripe **LIVE** — Phase 7 |
| `RESEND_API_KEY`, `RESEND_AUDIENCE_ID` | console Resend ; `NEWSLETTER_FROM`/`CONTACT_NOTIFY_TO` = `eleonore@encrehumaine.fr` |
| `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile (widget du domaine) |
| `BOOKING_URL` | Cal.com (déjà obtenu) |
| `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_ASSETS`, `R2_BUCKET_BACKUPS` | Cloudflare R2 |
| `BACKUP_PASSPHRASE` | aléatoire **forte** — ⚠️ en garder une copie **HORS de l'hôte** (sinon backups irrécupérables) |
| `CLOUDFLARE_API_TOKEN` | token Cloudflare avec **DNS edit** sur la zone (pour le challenge TLS DNS-01 de Caddy) |
| `ANALYTICS_SCRIPT_URL` = `https://stats.encrehumaine.fr/script.js`, `ANALYTICS_WEBSITE_ID` | renseigné après création du site dans Umami (Phase 8) ; vide → aucun script injecté (dégradation propre) |
| `BASE_URL` = `https://encrehumaine.fr`, `DIRECTUS_PUBLIC_URL` = `https://cms.encrehumaine.fr` | URLs publiques |
| `VAT_ENABLED` = `false`, `VAT_RATE`, `BACKUP_CRON`, `BACKUP_KEEP_*` | reprendre les valeurs de `.env.example` |

⚠️ **Footgun `runtimeConfig`** : toute **nouvelle** clé exposée à l'app doit être
ajoutée au bloc `environment:` (`NUXT_*`) du service `web` dans
`infra/docker-compose.yml` (un commentaire d'avertissement y figure). Les clés
actuelles y sont déjà.

---

## Phase 2 — Cloudflare (DNS, proxy, TLS, Turnstile, R2)

- ▢ **DNS** : enregistrements `A`/`AAAA` pour `@`, `cms`, `stats` → IP du serveur Hetzner.
- ▢ **Proxy ORANGE** (nuage orange) sur ces 3 entrées. Mode SSL/TLS = **Full (strict)**.
- ▢ **Token API DNS-01** : créer un token *Edit zone DNS* sur la zone → `CLOUDFLARE_API_TOKEN`. Caddy obtient ses certificats via DNS-01 (pas besoin du port 80 ouvert pour l'ACME).
- ▢ **Turnstile** : créer un widget pour `encrehumaine.fr` → `TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`.
- ▢ **R2** : 2 buckets (assets + backups) + clés d'accès → variables `R2_*`.
- ✅ Noter que la CSP (module `nuxt-security`) et le Caddyfile autorisent déjà `js.stripe.com`, `challenges.cloudflare.com`, `app.cal.com`, `stats.encrehumaine.fr`.

---

## Phase 3 — Serveur Hetzner

- ▢ Provisionner un serveur (Docker + Docker Compose installés ; Ubuntu/Debian récent).
- ▢ Créer l'utilisateur de déploiement, l'ajouter au groupe `docker`.
- ▢ Déposer la **clé publique de déploiement** (cf. `.forgejo/workflows/README.md`) dans son `~/.ssh/authorized_keys`.
- ▢ **Cloner le dépôt** à `DEPLOY_PATH` (ex. `/srv/encre-humaine`).
- ▢ **Firewall Hetzner (Cloud Firewall ou ufw)** — *audit #1, défense en profondeur* :
  - `80`/`443` **uniquement** depuis les **plages IP Cloudflare** (`https://www.cloudflare.com/ips/`).
  - `22` (SSH) **uniquement** depuis tes IP d'admin.
  - Tout le reste fermé. Les ports Postgres/Directus/Umami ne sont **jamais** publiés (réseau `internal` du compose).
- ✅ **Vérifier les plages CF figées** dans `infra/Caddyfile` (`trusted_proxies static …`) contre la liste canonique — *audit #1*. À revérifier périodiquement.

---

## Phase 4 — Le fichier `.env` de production

```sh
cp /srv/encre-humaine/infra/env/.env.example /srv/encre-humaine/infra/env/.env
$EDITOR /srv/encre-humaine/infra/env/.env     # remplir avec les secrets de la Phase 1
chmod 600 /srv/encre-humaine/infra/env/.env
```

- ⚠️ **Ne jamais committer** ce fichier (déjà gitignoré). Rotation/édition **à la main en SSH** — la CI n'y touche pas.
- ⚠️ Garder la **`BACKUP_PASSPHRASE` aussi hors de l'hôte**.

---

## Phase 5 — CI Forgejo

Détail complet : `.forgejo/workflows/README.md`. En résumé :

- ▢ Enregistrer un `act_runner` avec le label **`docker`** (sinon adapter `runs-on` dans `ci.yml`/`deploy.yml`).
- ▢ Créer les 5 secrets Forgejo : `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS` (= `ssh-keyscan -t ed25519 <host>`), `DEPLOY_USER`, `DEPLOY_HOST`, `DEPLOY_PATH`.
- ✅ `ci.yml` (lint/typecheck/tests/build) tourne sur push `main` + PR ; `deploy.yml` sur tag `v*` ou déclenchement manuel.

---

## Phase 6 — Premier déploiement (stack docker)

Le service `migrate` (one-shot) applique les migrations Drizzle **avant** le
rollout de `web` ; `compose up --wait` attend les healthchecks.

Depuis le serveur, dans `DEPLOY_PATH` :

```sh
docker compose --env-file infra/env/.env -f infra/docker-compose.yml up -d --build --wait
```

(ou, équivalent piloté par la CI : pousser un tag `git tag v1.0.0 && git push origin v1.0.0`).

✅ Vérifications :
- `docker compose ps` → tous **healthy** (postgres, directus, umami, web, caddy), `migrate` **exited 0**.
- Schémas/rôles Postgres : `docker compose exec postgres psql -U postgres -c "\dn"` → `app`, `directus`, `umami`.
- TLS : logs Caddy → certificats obtenus via DNS-01 pour les 3 domaines.
- `https://encrehumaine.fr` répond ; `https://encrehumaine.fr/api/health` = ok.

---

## Phase 7 — Initialiser Directus (schéma + contenu)

Le **schéma** Directus n'est pas dans le compose : le bootstrap se lance depuis
**un poste disposant de la toolchain** (ton laptop), ciblant le CMS de prod via
`DIRECTUS_URL`. Le volume étant neuf, l'admin = `DIRECTUS_ADMIN_EMAIL` du `.env`
(pas de piège d'admin local).

```sh
# Depuis le repo, sur ton poste :
DIRECTUS_URL=https://cms.encrehumaine.fr \
DIRECTUS_ADMIN_EMAIL=admin@encrehumaine.fr \
DIRECTUS_ADMIN_PASSWORD='<prod>' \
DIRECTUS_READ_TOKEN='<le même que dans .env prod>' \
DIRECTUS_EDITOR_PASSWORD='<mot de passe initial Eléonore>' \
pnpm --filter @encre/directus bootstrap
```

- ✅ `bootstrap` rejoué = **+0** (idempotent). Crée collections/champs/relations/rôles + l'utilisateur API lecture-seule (token `DIRECTUS_READ_TOKEN`) + le **compte éditrice d'Eléonore** (rôle Éditrice, `DIRECTUS_EDITOR_EMAIL`, mot de passe initial `DIRECTUS_EDITOR_PASSWORD` qu'elle change à la 1re connexion ; non réécrasé aux re-runs).
- **Comptes** : toi = **admin** (`admin@encrehumaine.fr`, créé au 1er boot depuis le `.env`) ; Eléonore = **éditrice** (créée par le bootstrap, ne peut PAS toucher au schéma/réglages).
- ▢ **Contenu réel** : saisir dans l'admin Directus (Eléonore). Le `seed` contient du contenu **démo** (témoignages/articles fictifs) **+** les **bases légales réelles** (`legal_documents`) avec marqueurs `[À COMPLÉTER]`. En prod : saisir le vrai contenu à la main ; reprendre les bases légales depuis le seed et **remplir l'identité** (SIRET, adresse, médiateur…). Renseigner aussi `site_settings` (siret/adresse) pour le footer.
- ▢ Activer la boutique quand prête : `shop_page.shop_enabled = true`.

---

## Phase 8 — Stripe LIVE & Umami

**Stripe (mode LIVE)** :
- ▢ Créer les **produits + prix** en mode LIVE ; reporter chaque `stripe_product_id` (`prod_…` live) dans le produit Directus correspondant.
- ▢ Créer le **shipping rate** → `STRIPE_SHIPPING_RATE_FR` (`shr_…` live).
- ▢ Créer le **endpoint webhook** `https://encrehumaine.fr/api/stripe/webhook`, abonné à `checkout.session.completed` + `charge.refunded` → `whsec_…` → `STRIPE_WEBHOOK_SECRET`.
- ▢ Mettre ces 3 valeurs dans `infra/env/.env` puis redéployer (`compose up -d` relit l'env).
- ✅ Test d'un achat réel de bout en bout (carte réelle ou test selon mode) → commande en base `app.orders`, idempotence (rejeu webhook = 1 ligne).

**Umami** :
- ▢ Se connecter à `https://stats.encrehumaine.fr`, créer un « website » pour `encrehumaine.fr` → récupérer le **website id** → `ANALYTICS_WEBSITE_ID` (+ `ANALYTICS_SCRIPT_URL`), redéployer.

---

## Phase 9 — Vérifications post-déploiement (checklist d'audit)

- ✅ **CSP** : ouvrir la console du navigateur sur chaque page → **0 violation** avec les tiers réels (Stripe checkout, embed Cal.com, widget Turnstile, script Umami).
- ✅ **Rate-limit** : `POST /api/contact` 6× rapidement → `429`. Idem `/api/newsletter/confirm` (10/min).
- ✅ **IP cliente** : le rate-limit est bien **par visiteur** (pas global) — preuve indirecte que Caddy résout `{client_ip}` derrière Cloudflare.
- ✅ **Headers** : HSTS, X-Content-Type-Options, Referrer-Policy, CSP à nonce présents sur le site ; en-têtes sécurité sur `cms.`/`stats.`.
- ✅ **Newsletter** : inscription → email de confirmation → page avec bouton **« Confirmer »** (POST) → succès. Un simple GET du lien ne confirme PAS.
- ✅ **Emails** : confirmation newsletter + notification contact (`eleonore@encrehumaine.fr`) bien reçus (vérifier SPF/DKIM Resend).
- ✅ **SEO/JSON-LD** : balises Product/Article rendues, pas de rupture de `<script>`.

---

## Phase 10 — Sauvegardes

- ▢ Lancer une sauvegarde immédiate et vérifier l'arrivée dans R2 :
  ```sh
  docker compose --env-file infra/env/.env -f infra/docker-compose.yml run --rm \
    --entrypoint /usr/local/bin/backup.sh backup
  ```
- ▢ **Tester une restauration** sur une cible jetable (cf. `infra/backup/README.md`) **avant** de considérer la prod sûre.
- ✅ Confirmer que la `BACKUP_PASSPHRASE` est sauvegardée **hors de l'hôte**.

---

## Exploitation courante

- **Déployer une MAJ** : merger sur `main` (CI verte) → `git tag vX.Y.Z && git push origin vX.Y.Z` (ou « Run workflow »). `compose up --wait` = porte de santé (échoue si un service reste unhealthy).
- **Logs** : `docker compose -f infra/docker-compose.yml logs -f web` (ou `caddy`, `directus`…).
- **Rollback** : re-déployer un tag antérieur (`git push` du tag → run, ou checkout du tag côté serveur + `compose up -d --build`). La base n'est pas rollbackée — éviter les migrations destructives.
- **Restauration désastre** : `make restore NAME=latest` (depuis un hôte avec la toolchain + accès R2 + `BACKUP_PASSPHRASE`).

---

## Récap des points à NE PAS oublier

1. `BACKUP_PASSPHRASE` **hors de l'hôte** (sinon backups perdus avec le serveur).
2. **Firewall** origine → IP Cloudflare (orange cloud).
3. **Plages CF** du Caddyfile à jour.
4. `DIRECTUS_READ_TOKEN` fixé **avant** le bootstrap.
5. Toute nouvelle clé `runtimeConfig` → ajoutée au bloc `NUXT_*` du compose.
6. Identité légale `[À COMPLÉTER]` remplie avant d'exposer les pages légales.
7. Stripe **LIVE** (clés/produits/prix/shipping/webhook) — ne pas laisser de `sk_test`.
