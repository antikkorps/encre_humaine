# 05 — Boutique (Stripe)

> Dépend de `00`, `01`, `02`, `03`. Vente de serious games physiques. **Stripe au maximum**, Checkout hébergé, achat invité, expédition manuelle par Eléonore en phase 1.

---

## 1. Répartition des responsabilités

| Concern | Géré par |
|---------|----------|
| Catalogue, prix, paiement, 3DS, reçu, adresse de livraison | **Stripe** |
| Contenu éditorial produit (description, visuels, détails) | **Directus** (`products`) |
| Enregistrement commande, historique, emails | **Nous** (webhook → `orders` + Resend) |
| Préparation & expédition | **Eléonore** via Dashboard Stripe (phase 1) |
| TVA | **Aucune** en franchise en base (flag pour plus tard) |

Lien produit : `products.stripe_product_id` (Directus) ↔ Product/Price (Stripe).

---

## 2. Catalogue — `GET /api/shop/products`
```
1. Récupérer les products Directus published (éditorial + stripe_product_id)
2. Récupérer les prices actifs Stripe correspondants
3. Merger ; n'exposer que les produits présents et actifs des deux côtés
4. Mettre en cache (revalidation courte, ex. 60s) ; ISR côté pages
```
Sortie : `{ id, slug, name, tagline, images, priceId, unitAmount, currency, ... }`. **Jamais de prix en dur.**

---

## 3. Tunnel d'achat — `POST /api/shop/checkout`

Crée une **Checkout Session** Stripe et renvoie l'URL de redirection.

```ts
stripe.checkout.sessions.create({
  mode: "payment",
  line_items: [{ price: PRICE_ID, quantity }],      // depuis le panier
  locale: "fr",
  customer_creation: "if_required",
  customer_email,                                    // pré-rempli si dispo
  shipping_address_collection: { allowed_countries: ["FR"] }, // Europe = plus tard
  shipping_options: [{ shipping_rate: SHIPPING_RATE_FR }],    // forfait France
  // FRANCHISE EN BASE : pas de taxe
  automatic_tax: { enabled: VAT_ENABLED },          // false en phase 1
  invoice_creation: { enabled: true },
  custom_text: {
    submit: { message: "TVA non applicable, art. 293 B du CGI" } // tant que !VAT_ENABLED
  },
  success_url: `${BASE}/laboratoire/confirmation?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${BASE}/laboratoire`,
  metadata: { /* ids internes éventuels */ }
})
```

- **Panier** : minimal multi-produits (état client) → `line_items` à la création de session. Achat à l'unité possible aussi.
- **Stock** : volume faible → gestion manuelle ; un produit en rupture est dépublié (Directus) ou son prix désactivé (Stripe). (Inventaire Stripe automatisé = backlog.)
- **Retrait sur place** (Bouches-du-Rhône) : option possible via un `shipping_rate` à 0 € « Retrait » (optionnel phase 1).

---

## 4. Flag TVA (basculement franchise → assujetti)

Variable `VAT_ENABLED` (+ `VAT_RATE` si besoin). Quand le client dépasse le seuil de services (cf. `00` §6) :
- `automatic_tax.enabled = true` (Stripe Tax) ;
- retrait de la mention 293 B, affichage des lignes de TVA ;
- `orders.vat_applied = true`, `amount_vat` renseigné par le webhook.

**Aucune migration**, aucun changement de code structurel : bascule de configuration (ADR #4).

---

## 5. Confirmation & emails

- **Page** `/laboratoire/confirmation?session_id=...` : récupère la session (lecture), affiche un récap. La **persistance réelle** est faite par le webhook (`03` §1), pas par cette page (l'utilisateur peut ne jamais revenir).
- **Email client** (Resend, marque L'Encre Humaine) : confirmation de commande, récap, délai d'expédition indicatif.
- **Email Eléonore** (Resend) : nouvelle commande à préparer (produit, quantité, adresse) — son signal d'expédition en complément du Dashboard Stripe.

---

## 6. Remboursements / annulations
- Effectués par Eléonore depuis le **Dashboard Stripe**.
- `charge.refunded` (webhook) → `orders.status = refunded | partially_refunded`.

---

## 7. Conformité
- **Droit de rétractation 14 jours** (B2C, bien physique) → CGV produits (`04/10`).
- Reçu/facture Stripe + mention 293 B.
- Pas de compte client, pas de données de paiement chez nous (Stripe seul).

---

## 8. Critères d'acceptation
1. Aucun prix en dur ; tout vient de Stripe.
2. Produit dépublié/inactif → absent du catalogue et non achetable.
3. Checkout en français, collecte adresse FR, forfait de port appliqué.
4. Phase 1 : `automatic_tax=false`, mention 293 B visible, `vat_applied=false`.
5. Basculement TVA = changement de config (`VAT_ENABLED`) sans migration.
6. Commande persistée par le **webhook** (pas la page succès) ; idempotence (`03`).
7. Emails client + Eléonore envoyés une seule fois par commande.
8. Rétractation 14 j couverte par les CGV.

---

*Suivant : `06-security.md`.*
