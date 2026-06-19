# 06 — Sécurité & conformité

> Dépend de tous les fichiers précédents. Surface volontairement réduite (pas d'auth publique, pas de données de paiement chez nous). Ce fichier liste les garde-fous obligatoires.

---

## 1. Validation des entrées
- **Tous** les endpoints valident leur payload (`valibot`/`zod`), schémas dans `packages/shared` (réutilisés client + serveur).
- Rejets explicites (`422`) avec enveloppe d'erreur uniforme. Aucune confiance dans les données client.

## 2. Rate-limiting
- Sur endpoints publics : `/api/contact`, `/api/newsletter/*`, `/api/shop/checkout`. **Webhook Stripe exclu** (protégé par signature).
- Par IP, fenêtre glissante (ex. 5 req/min/IP sur contact & subscribe). `429` au-delà.
- **IP réelle derrière Caddy/Cloudflare** : lire `CF-Connecting-IP` (ou `X-Forwarded-For` de confiance), proxies de confiance configurés. Ne jamais rate-limiter sur l'IP du proxy.

## 3. Anti-bot
- **Cloudflare Turnstile** sur contact + newsletter (+ tout futur formulaire public). Vérification **serveur** (siteverify) obligatoire, jamais seulement client. Honeypot en complément.

## 4. Webhook Stripe
- Signature vérifiée (raw body + `STRIPE_WEBHOOK_SECRET`). Idempotence (`03` §1). Aucune action sur signature invalide.

## 5. Secrets & configuration
- Secrets en variables d'env (`07-deploy`), **jamais** committés ni embarqués dans les images.
- **Validation d'env au boot** (schéma `valibot`/`zod`) : l'app refuse de démarrer si une variable requise manque ou est malformée.
- Token Directus de l'app : **lecture seule**, server-side uniquement, jamais exposé au navigateur.

## 6. En-têtes HTTP & CSP
Posés par Caddy (ou Nitro) :
- `Strict-Transport-Security` (HSTS), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options`/`frame-ancestors`, `Permissions-Policy` minimal.
- **CSP** stricte avec allow-list pour : Stripe (`js.stripe.com`, `checkout.stripe.com`), Cal.com (`app.cal.com`, frames `cal.com`), Turnstile (`challenges.cloudflare.com`), Umami (domaine self-hosted), R2/Directus (images). `default-src 'self'`, pas de `unsafe-inline` non maîtrisé (nonces si nécessaire).

## 7. Cookies & consentement
- **Bandeau de consentement** maison, 2 catégories : *nécessaire* / *tiers (embeds)*.
- **Umami cookieless** → exempté de consentement (config CNIL respectée : pas de cross-site, IP anonymisée).
- **Embed RDV (Cal.com) & Stripe** : chargés **après consentement**. Aucun cookie tiers avant action utilisateur. (Provider RDV isolé dans `BookingEmbed` — interchangeable.)
- Choix de consentement mémorisé (cookie strictement nécessaire, pas de tracking).

## 8. RGPD
- **Bases légales** : contact (intérêt légitime / mesure précontractuelle), newsletter (**consentement** via double opt-in), commandes (exécution du contrat + obligation comptable).
- **Preuve de consentement** newsletter conservée (`01` §7-8).
- **Durées de conservation** : cf. `01` §8 (commandes 10 ans, leads 3 ans, pending newsletter 30 j).
- **Minimisation** : pas d'IP sur les leads ; données strictement nécessaires.
- **Sous-traitants** à lister dans la politique de confidentialité : Stripe, Resend, Cloudflare, Hetzner, Cloudflare R2. Vérifier DPA/hébergement.
- **Droits** : procédure d'accès/effacement documentée (suppression DB + Resend + anonymisation commande dans la limite des obligations comptables).

## 9. Durcissement Directus
- Rôle Postgres Directus **restreint au schéma `directus`** (ne voit pas `app`) — `07-deploy`.
- Compte admin : mot de passe fort + **2FA**. Pas d'admin par défaut laissé actif.
- Permissions publiques Directus désactivées ; seul le **token lecture seule** (published) sert l'app.
- Directus non exposé publiquement au-delà du nécessaire (admin derrière auth ; idéalement accès admin restreint, cf. Tailscale possible côté ops).

## 10. Dépendances
- Fenêtre 30 j (Renovate `minimumReleaseAge`), exception sécurité (`vulnerabilityAlerts`). Lockfile committé. Audit régulier.

## 11. Sauvegardes & reprise
- Dump Postgres planifié → R2 (rclone), rétention définie. Test de restauration documenté. (Détail `07-deploy`.)

## 12. Critères d'acceptation
1. Aucun endpoint public sans validation + rate-limit (sauf webhook, protégé par signature).
2. Turnstile vérifié serveur ; soumission sans token valide rejetée.
3. App refuse de démarrer si une variable d'env requise manque.
4. CSP active, embeds tiers chargés seulement après consentement ; aucun cookie tiers avant action.
5. Directus ne peut pas lire `app` ; token app = lecture seule, published only, jamais côté client.
6. Politique de confidentialité couvre bases légales, durées, sous-traitants, droits.
7. Restauration d'un dump testée au moins une fois avant mise en prod.

---

*Suivant : `07-deploy.md`.*
