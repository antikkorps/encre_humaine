# 03 — Contrats d'API

> Dépend de `00`, `01`, `02`. Définit les endpoints backend (Nitro `server/`) : webhook Stripe, contact, newsletter (double opt-in), purge planifiée. C'est la logique « dure » du projet.

---

## 0. Principes transverses

- Tous les endpoints vivent dans `apps/web/server/` (Nitro). Pas de service séparé (ADR #1).
- **Validation systématique** des entrées via `valibot` (léger) ou `zod` — schéma défini dans `packages/shared`, réutilisé client + serveur (DRY).
- **Enveloppe d'erreur** uniforme : `{ error: { code: string, message: string } }`, statut HTTP cohérent.
- **Rate-limiting** sur tous les endpoints publics (détail `06-security`).
- **Jamais** de secret ou de token Directus/Stripe/Resend exposé au client : tout appel tiers part du serveur.
- Idempotence et sécurité priment sur la concision du code.

---

## 1. Webhook Stripe — `POST /api/stripe/webhook`

Cœur de la boutique. Reçoit les événements Stripe, enregistre la commande, déclenche les emails.

### Contraintes critiques
1. **Body brut obligatoire** pour la vérification de signature. Désactiver le body-parser de Nitro sur cette route (lecture du raw body).
2. **Vérification de signature** via `stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET)`. Toute signature invalide → `400`, aucun traitement.
3. **Idempotence** : Stripe **rejoue** les événements. Garantie par la contrainte unique `orders.stripe_session_id` + insertion `ON CONFLICT DO NOTHING`. Un même événement traité deux fois ne crée qu'une commande et n'envoie qu'un email.
4. **Sémantique de retry** : ne répondre `2xx` qu'**après** persistance réussie. En cas d'erreur transitoire (DB indisponible), répondre `5xx` → Stripe réessaiera. L'email ne doit jamais bloquer le `2xx` (voir ci-dessous).

### Événements traités

| Événement | Action |
|-----------|--------|
| `checkout.session.completed` | créer la commande (si `payment_status = paid`), envoyer emails |
| `charge.refunded` | passer `orders.status` → `refunded` / `partially_refunded` |
| *(autres)* | ignorés, `200` (accusé de réception) |

### Flux `checkout.session.completed`

```
1. Vérifier signature (sinon 400)
2. Si event.type non géré → 200 (ack)
3. Récupérer la session ; expand line_items + customer_details + shipping_details
4. Si payment_status != "paid" → 200 (rien à faire)
5. INSERT orders (...) ON CONFLICT (stripe_session_id) DO NOTHING
   → renvoie la ligne créée, ou rien si déjà traité (rejeu)
6. Si une ligne a été créée :
     - enqueue email client (confirmation, Resend)
     - enqueue email Eléonore (notification commande)
7. Répondre 200
```

- **Découplage email / réponse** : l'envoi Resend ne doit pas faire échouer le `2xx`. En phase 1 (volume faible), envoi best-effort avec try/catch + log ; `notification_sent` mis à jour si succès. (File d'attente = backlog si volume.)
- **Mapping commande** : `items` ← `line_items` (name, quantity, unit_amount, currency, stripe_product_id) ; `shipping` ← `shipping_details` ; `amount_total`, `amount_shipping` ← session ; `vat_applied=false`, `amount_vat=0` en franchise en base.

### Réponses
- `200` traité ou ignoré · `400` signature invalide · `5xx` erreur transitoire (déclenche retry Stripe).

---

## 2. Contact — `POST /api/contact`

### Requête
```ts
{
  firstName: string,        // 1..80, requis
  email: string,            // email valide, requis
  audience: "organisation" | "particulier",  // requis
  message: string,          // 10..2000, requis
  sourcePage?: string,      // route d'origine
  turnstileToken: string    // requis
}
```

### Traitement
```
1. Valider le payload (valibot) → 422 si invalide
2. Vérifier Turnstile côté serveur (siteverify) → 403 si échec
3. Rate-limit par IP (06-security) → 429 si dépassé
4. INSERT contact_leads (status=new, notification_sent=false)
5. Envoyer email à Eléonore (Resend) ; si OK → notification_sent=true
6. (optionnel) email d'accusé de réception au visiteur
7. 200 { ok: true }
```

### Réponses
`200` · `422` validation · `403` Turnstile · `429` rate-limit.

> Pas d'IP persistée (cf. `01` §6) ; l'IP sert seulement au rate-limit en mémoire.

---

## 3. Newsletter — double opt-in (non natif Resend)

Rappel `00`/`01` : Resend ne fournit pas le double opt-in ; on l'implémente. Resend = diffusion, notre table `newsletter_subscribers` = registre de consentement + pilotage.

### 3.1 Inscription — `POST /api/newsletter/subscribe`

**Requête**
```ts
{ firstName?: string, email: string, turnstileToken: string }
```

**Traitement**
```
1. Valider + Turnstile + rate-limit
2. Générer token aléatoire (32+ octets, base64url)
3. Calculer token_hash (sha-256) ; token en clair jamais stocké
4. UPSERT newsletter_subscribers par email :
     - si absent : status=pending, token_hash, expires_at=now+30j,
       consent_ip, consent_user_agent, requested_at=now
     - si pending existant : régénérer token + repousser expires_at (renvoi du mail)
     - si confirmed : 200 idempotent (déjà abonné, pas de nouveau mail)
5. Créer/màj le contact Resend en UNSUBSCRIBED ; stocker resend_contact_id
6. Envoyer l'email de confirmation (lien tokenisé) via Resend
7. 200 { status: "pending" | "already_subscribed" }
```

Lien de confirmation : `https://{domain}/newsletter/confirmation?token={token}&email={email}` (token en clair dans l'URL, comparé au hash).

### 3.2 Confirmation — `GET /api/newsletter/confirm`

**Requête** : `?token=...&email=...`

**Traitement**
```
1. Charger subscriber par email
2. Si absent / déjà confirmed / expires_at < now → page d'état adaptée
3. Comparer sha-256(token) au token_hash (comparaison constante)
4. Si OK :
     - status=confirmed, confirmed_at=now, token_hash=null, expires_at=null
     - passer le contact Resend en SUBSCRIBED
     - (optionnel) email de bienvenue + ressource cadeau
5. Rediriger vers page de confirmation (succès / lien expiré / invalide)
```

### 3.3 Désinscription
- Lien de désinscription **géré par Resend** (obligatoire, dans chaque broadcast).
- Synchronisation retour : si webhook Resend disponible → `status=unsubscribed`, `unsubscribed_at`. Sinon réconciliation périodique. (Diffusion = phase 3 ; à câbler à ce moment.)

### 3.4 Purge RGPD — tâche planifiée

`server/tasks/` (Nitro scheduled task) ou cron conteneur :
```
Quotidien :
  Sélectionner newsletter_subscribers où status=pending ET expires_at < now
  Pour chacun : supprimer le contact Resend (si présent) puis la ligne DB
  Logguer le nombre purgé
```

> Conservation de la **preuve de consentement** uniquement pour les `confirmed` (cf. `01` §8).

---

## 4. Lecture du catalogue (boutique)

Détaillé dans `05-shop`, contrat ici pour mémoire.

- `GET /api/shop/products` : merge **Directus** (éditorial, par `stripe_product_id`) + **Stripe** (prix actifs). Résultat mis en cache (revalidation courte). Ne renvoie que les produits `published` côté Directus **et** actifs côté Stripe.
- `POST /api/shop/checkout` : crée une Checkout Session (voir `05`).

---

## 5. Critères d'acceptation

1. **Idempotence webhook prouvée par test Vitest** : deux appels du même `checkout.session.completed` → 1 commande, 1 email.
2. Signature Stripe invalide → `400`, aucune écriture.
3. `2xx` renvoyé uniquement après persistance ; erreur DB → `5xx`.
4. Échec d'envoi email ne crée pas de doublon de commande ni de `5xx`.
5. Double opt-in : un `pending` non confirmé ne reçoit **aucun** broadcast (il est `unsubscribed` chez Resend).
6. Token de confirmation : seul le **hash** est stocké ; comparaison à temps constant ; expiration respectée.
7. Purge : un `pending` de plus de 30 j disparaît de la DB **et** de Resend.
8. Tous les endpoints publics valident leurs entrées et sont rate-limités.
9. Aucun secret tiers atteignable depuis le client.

---

*Suivant : `04-pages/` (specs page par page).*
