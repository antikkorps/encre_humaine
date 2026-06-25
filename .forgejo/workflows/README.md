# CI / CD — L'Encre Humaine (Forgejo Actions)

Deux workflows, runner **Docker dédié** (hors prod) :

| Workflow | Déclencheur | Rôle |
|---|---|---|
| `ci.yml` | push `main` + toute PR | lint → typecheck → tests → build (vérification). **Aucun déploiement.** |
| `deploy.yml` | tag `v*` **ou** bouton « Run workflow » | SSH → `git checkout` + `docker compose up -d --build` **sur le serveur Hetzner**. |

Stratégie retenue : **build sur le serveur** (pas de registry), **déploiement manuel** (tag/dispatch), **`.env` maintenu à la main** sur l'hôte.

---

## 1. Runner

Les deux jobs utilisent `runs-on: docker`. Adapte ce label à celui qu'annonce
ton `act_runner` dédié (sinon les jobs ne seront jamais pris). Le runner doit
être en **mode docker** (il lance les conteneurs `node:26.0.0-bookworm-slim` et
`alpine:3.20`) et pouvoir tirer des images.

## 2. Secrets Forgejo (dépôt → Settings → Actions → Secrets)

Uniquement des secrets de **déploiement** (aucun secret applicatif : le `.env`
vit sur l'hôte) :

| Secret | Contenu |
|---|---|
| `DEPLOY_SSH_KEY` | Clé privée SSH (ed25519) dont la **publique** est dans `~/.ssh/authorized_keys` du user de déploiement sur Hetzner. |
| `DEPLOY_KNOWN_HOSTS` | Sortie de `ssh-keyscan -t ed25519 <ip-ou-host-hetzner>` (épingle la clé hôte). |
| `DEPLOY_USER` | Utilisateur SSH sur Hetzner (membre du groupe `docker`). |
| `DEPLOY_HOST` | IP ou hostname du serveur Hetzner. |
| `DEPLOY_PATH` | Chemin du clone du dépôt sur le serveur (ex. `/srv/encre-humaine`). |

Génération de la paire de clés dédiée :
```sh
ssh-keygen -t ed25519 -C "forgejo-deploy" -f deploy_key -N ""
# deploy_key.pub → ~/.ssh/authorized_keys du user sur Hetzner
# deploy_key     → secret DEPLOY_SSH_KEY
```

## 3. Pré-requis sur le serveur Hetzner (une fois)

```sh
# Docker + plugin compose installés ; user de déploiement dans le groupe docker.
sudo usermod -aG docker "$DEPLOY_USER"

# Clone du dépôt (remote Forgejo) au chemin DEPLOY_PATH.
git clone ssh://git@git.fvienot.link/antikkorps/encre_humaine.git /srv/encre-humaine

# Fichier d'environnement de PROD, créé à la main depuis l'exemple, puis rempli
# avec les vraies valeurs (Stripe, Directus, Postgres, R2, Turnstile, Cal.com…).
cp /srv/encre-humaine/infra/env/.env.example /srv/encre-humaine/infra/env/.env
$EDITOR /srv/encre-humaine/infra/env/.env   # secrets réels — NE JAMAIS committer
```

> Le `.env` n'est jamais touché par la CI : rotation/édition manuelle en SSH.

## 4. Déployer

- **Sur tag** (recommandé pour tracer les versions) :
  ```sh
  git tag v1.0.0 && git push origin v1.0.0
  ```
- **Manuellement** : dépôt → Actions → « deploy » → *Run workflow* (déploie la
  branche `main`).

`compose up --wait` attend les healthchecks et fait **échouer** le déploiement
si un service reste *unhealthy*.

## 5. Durcissement réseau (audit sécurité #1 — à faire à la mise en prod)

Si le site est **proxifié par Cloudflare** (orange cloud), `CF-Connecting-IP`
est de confiance **seulement** si l'origine n'est joignable que par Cloudflare.
Sinon un attaquant atteint l'IP Hetzner en direct et **forge** cet en-tête →
contournement du rate-limit. **Firewaller l'origine aux plages d'IP Cloudflare**
(Hetzner Cloud Firewall ou `ufw`), ports 80/443 uniquement depuis
`https://www.cloudflare.com/ips/`. Le port SSH reste restreint à tes IP d'admin.
