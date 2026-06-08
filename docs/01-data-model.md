# 01 — Modèle de données

> Dépend de `00-overview.md`. Définit **uniquement les tables que nous possédons** (schéma Drizzle). Le contenu éditorial est dans Directus (`02-content-model`), le catalogue commercial est dans Stripe (`05-shop`).

---

## 1. Principe : qui possède quoi

C'est le point le plus important du modèle, et la garantie anti-duplication. Trois sources de vérité, **jamais recopiées** l'une dans l'autre :

| Donnée | Source de vérité | Notre rôle |
|--------|------------------|------------|
| Catalogue produit (prix, stock, paiement) | **Stripe** | on lit via API, on ne stocke pas le prix en dur |
| Contenu éditorial produit (description, visuels, règles du jeu) | **Directus** | lié à Stripe par `stripe_product_id` |
| Pages, articles, témoignages | **Directus** | — |
| Liste de diffusion newsletter | **Resend** (Audiences) | on synchronise depuis notre registre de consentement |
| **Commandes, leads, consentements** | **NOUS (Postgres)** | tables Drizzle ci-dessous |

> ⚠️ **Pas de table `products` dans Drizzle.** Un produit = données commerciales Stripe + contenu Directus, reliés par l'identifiant Stripe. Créer une table produit chez nous violerait le DRY et créerait une 3ᵉ source à synchroniser. L'agent ne doit pas en créer.

---

## 2. Séparation des schémas Postgres

Une seule instance Postgres, **trois schémas isolés** :

| Schéma | Propriétaire | Migrations |
|--------|--------------|------------|
| `app` | nous (Drizzle) | `drizzle-kit`, dans `packages/db/migrations` |
| `directus` | Directus | auto-gérées par Directus |
| `umami` | Umami | auto-gérées par Umami |

Nos migrations Drizzle ne touchent **que** le schéma `app`. Directus et Umami gèrent les leurs au démarrage de leurs conteneurs. Aucun croisement de FK entre schémas.

```ts
// packages/db/src/schema/_schema.ts
import { pgSchema } from "drizzle-orm/pg-core";
export const app = pgSchema("app");
```

---

## 3. Conventions

- **Clés primaires** : `uuid` v7 généré côté app (triable chronologiquement, non énumérable — pas de fuite de volume comme un serial).
- **Timestamps** : `timestamptz`, `created_at` / `updated_at` par défaut `now()`.
- **Montants** : entiers en **centimes** (jamais de float monétaire), cohérent avec Stripe.
- **Enums** : `pgEnum` dans le schéma `app`.
- **Snapshots immuables** : une commande capture ce qui a été acheté *au moment de l'achat* (JSONB), pas une FK vers un produit qui peut changer ensuite.

```ts
// packages/db/src/schema/_helpers.ts
import { uuidv7 } from "uuidv7";
import { app } from "./_schema";
import { timestamp } from "drizzle-orm/pg-core";

export const pk = () => app.table; // cf. usage ci-dessous, pk via .$defaultFn(() => uuidv7())
export const createdAt = timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
export const updatedAt = timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date());
```

---

## 4. Enums

```ts
import { app } from "./_schema";

export const audienceEnum = app.enum("audience", ["organisation", "particulier"]);
export const orderStatusEnum = app.enum("order_status", ["paid", "refunded", "partially_refunded", "canceled"]);
export const fulfillmentStatusEnum = app.enum("fulfillment_status", ["pending", "shipped", "delivered"]);
export const leadStatusEnum = app.enum("lead_status", ["new", "contacted", "closed"]);
export const subscriberStatusEnum = app.enum("subscriber_status", ["pending", "confirmed", "unsubscribed"]);
```

---

## 5. Table `orders` — miroir des commandes Stripe

Créée **uniquement** par le webhook `checkout.session.completed`. Stripe reste la source de vérité du paiement ; cette table est notre registre local (historique, email, suivi logistique futur, comptabilité).

```ts
import { uuid, text, integer, jsonb, timestamp, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { app } from "./_schema";
import { orderStatusEnum, fulfillmentStatusEnum } from "./enums";
import { createdAt, updatedAt } from "./_helpers";

export const orders = app.table("orders", {
  id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),

  // Liens Stripe (source de vérité)
  stripeSessionId: text("stripe_session_id").notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeCustomerId: text("stripe_customer_id"),

  // Client (snapshot)
  email: text("email").notNull(),
  name: text("name"),
  shipping: jsonb("shipping").$type<{
    name?: string; line1?: string; line2?: string;
    postalCode?: string; city?: string; country?: string;
  }>(),

  // Contenu de la commande (snapshot immuable)
  items: jsonb("items").$type<Array<{
    stripeProductId?: string; name: string;
    quantity: number; unitAmount: number; currency: string;
  }>>().notNull(),

  amountTotal: integer("amount_total").notNull(),       // centimes
  amountShipping: integer("amount_shipping").default(0),
  currency: text("currency").notNull().default("eur"),

  // TVA : false en franchise en base ; passera true au basculement (ADR #4)
  vatApplied: boolean("vat_applied").notNull().default(false),
  amountVat: integer("amount_vat").default(0),

  status: orderStatusEnum("status").notNull().default("paid"),

  // Suivi logistique : exploité en phase 2 (vue Commandes). Colonnes prêtes dès maintenant
  // pour éviter une migration plus tard. En phase 1, Eléonore suit via Dashboard Stripe.
  fulfillmentStatus: fulfillmentStatusEnum("fulfillment_status").notNull().default("pending"),
  trackingNumber: text("tracking_number"),
  fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),

  createdAt,
  updatedAt,
}, (t) => ({
  sessionUx: uniqueIndex("orders_stripe_session_ux").on(t.stripeSessionId), // idempotence webhook
  emailIx: index("orders_email_ix").on(t.email),
  fulfillmentIx: index("orders_fulfillment_ix").on(t.fulfillmentStatus),
  createdIx: index("orders_created_ix").on(t.createdAt),
}));
```

**Décisions notables :**
- `stripe_session_id` **unique** : c'est le garde-fou d'idempotence. Stripe peut rejouer un webhook ; un `INSERT ... ON CONFLICT DO NOTHING` sur cette contrainte rend l'opération sûre (détaillé dans `03-api-contracts`).
- `vat_applied` / `amount_vat` présents **dès la phase 1** même si toujours `false` : c'est ce qui rend le basculement franchise → assujetti (ADR #4) sans migration.
- Colonnes de fulfillment incluses tout de suite (nullable / défaut) : coût nul maintenant, évite une migration en phase 2.
- `items` et `shipping` en **JSONB snapshot** : une commande doit refléter ce qui a été vendu, pas l'état actuel du catalogue.

---

## 6. Table `contact_leads` — soumissions du formulaire de contact

```ts
import { uuid, text, boolean, index } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { app } from "./_schema";
import { audienceEnum, leadStatusEnum } from "./enums";
import { createdAt, updatedAt } from "./_helpers";

export const contactLeads = app.table("contact_leads", {
  id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
  firstName: text("first_name").notNull(),
  email: text("email").notNull(),
  audience: audienceEnum("audience").notNull(),     // organisation | particulier
  message: text("message").notNull(),
  sourcePage: text("source_page"),                  // d'où vient la soumission
  status: leadStatusEnum("status").notNull().default("new"),
  notificationSent: boolean("notification_sent").notNull().default(false), // email Resend à Eléonore parti ?
  createdAt,
  updatedAt,
}, (t) => ({
  emailIx: index("leads_email_ix").on(t.email),
  statusIx: index("leads_status_ix").on(t.status),
  createdIx: index("leads_created_ix").on(t.createdAt),
}));
```

**Choix RGPD :** on **ne persiste pas l'adresse IP**. La protection anti-bot est assurée par Turnstile + rate-limiting (IP utilisée de façon transitoire en mémoire, jamais stockée). Minimisation des données : on ne garde que ce qui sert à recontacter la personne.

---

## 7. Table `newsletter_subscribers` — registre de consentement

Resend héberge la **liste de diffusion** ; cette table est notre **registre de consentement** (preuve RGPD du double opt-in + pilotage du flow + purge des non-confirmés). Les deux sont synchronisés.

```ts
import { uuid, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
import { app } from "./_schema";
import { subscriberStatusEnum } from "./enums";
import { createdAt, updatedAt } from "./_helpers";

export const newsletterSubscribers = app.table("newsletter_subscribers", {
  id: uuid("id").primaryKey().$defaultFn(() => uuidv7()),
  email: text("email").notNull(),
  firstName: text("first_name"),

  status: subscriberStatusEnum("status").notNull().default("pending"),

  // Double opt-in : hash du token de confirmation (jamais le token en clair)
  tokenHash: text("token_hash"),
  expiresAt: timestamp("expires_at", { withTimezone: true }), // requestedAt + 30j → purge

  // Preuve de consentement (RGPD)
  consentIp: text("consent_ip"),          // justifié : preuve de consentement
  consentUserAgent: text("consent_user_agent"),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),

  // Synchro Resend
  resendContactId: text("resend_contact_id"),

  createdAt,
  updatedAt,
}, (t) => ({
  emailUx: uniqueIndex("subscribers_email_ux").on(t.email),
  statusIx: index("subscribers_status_ix").on(t.status),
  expiresIx: index("subscribers_expires_ix").on(t.expiresAt),
}));
```

**Cycle de vie (résumé ; contrats détaillés dans `03-api-contracts`) :**
1. Inscription → ligne `status=pending`, `token_hash` posé, `expires_at = now + 30j`, contact créé chez Resend en **`unsubscribed`**. Email de confirmation envoyé.
2. Clic de confirmation → token vérifié → `status=confirmed`, `confirmed_at` posé, `token_hash` effacé, contact Resend passé **`subscribed`**.
3. Désinscription (lien Resend) → webhook/synchro → `status=unsubscribed`, `unsubscribed_at`.
4. Purge planifiée → suppression des `pending` dont `expires_at < now` (DB + contact Resend). 

> La **preuve de consentement** (ip, user-agent, dates) est conservée pour les `confirmed` au titre de l'obligation de pouvoir démontrer le consentement. À documenter dans la politique de confidentialité (`06-security`).

---

## 8. Rétention & purge (RGPD)

| Table | Rétention | Mécanisme |
|-------|-----------|-----------|
| `orders` | **10 ans** (obligation comptable FR) | aucune purge auto ; archivage seulement |
| `contact_leads` | 3 ans après dernier contact (prospection) puis purge | job planifié (phase 2) ; en phase 1, purge manuelle documentée |
| `newsletter_subscribers` (`pending`) | **30 jours** | job planifié — voir `03-api-contracts` |
| `newsletter_subscribers` (`confirmed`) | tant qu'abonné + durée de preuve raisonnable après désinscription | conservation de la preuve de consentement |

---

## 9. Migrations

- Outil : **`drizzle-kit`** ; migrations versionnées dans `packages/db/migrations`, committées.
- Application : étape dédiée au déploiement (job de migration avant le démarrage de `web`, voir `07-deploy`). Jamais de `push` auto en prod.
- Directus et Umami **ne sont pas** migrés par nous : leurs conteneurs s'auto-migrent au boot.
- Le client Drizzle et le schéma vivent dans `packages/db`, importés par `apps/web` via `workspace:*`. Les **types** (`InferSelectModel` / `InferInsertModel`) sont exportés depuis `packages/db` et réutilisés partout — aucun type de données ré-écrit à la main.

```ts
// packages/db/src/index.ts — exemple d'exports de types dérivés
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { orders, contactLeads, newsletterSubscribers } from "./schema";

export type Order = InferSelectModel<typeof orders>;
export type NewOrder = InferInsertModel<typeof orders>;
export type ContactLead = InferSelectModel<typeof contactLeads>;
export type NewsletterSubscriber = InferSelectModel<typeof newsletterSubscribers>;
// ... etc.
```

---

## 10. Critères d'acceptation

1. Les trois tables existent dans le schéma `app`, aucune dans `public`.
2. `orders.stripe_session_id` porte une contrainte **unique** (test : double insertion du même webhook → une seule ligne).
3. Aucune table `products` ni duplication du catalogue Stripe.
4. Tous les montants sont des entiers (centimes) ; aucun type `float`/`numeric` monétaire incohérent avec Stripe.
5. Les types TS consommés par `apps/web` sont **dérivés** du schéma Drizzle (pas de duplication).
6. La purge des `pending > 30j` est testable et documentée.
7. Aucune IP persistée dans `contact_leads`.

---

*Suivant : `02-content-model.md` (collections Directus & permissions Eléonore).*
