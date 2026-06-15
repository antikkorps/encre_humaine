import * as v from "valibot";

/**
 * Panier de checkout — docs/05-shop.md §3. Réutilisé client (panier) + serveur
 * (création de session Stripe) — DRY. On ne transporte JAMAIS de prix : seul le
 * `priceId` Stripe circule, le montant est calculé par Stripe (docs/05 §8.1).
 */
export const CheckoutItemSchema = v.object({
  priceId: v.pipe(v.string(), v.nonEmpty()),
  quantity: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(20)),
});

export type CheckoutItem = v.InferOutput<typeof CheckoutItemSchema>;

export const CheckoutPayloadSchema = v.object({
  items: v.pipe(v.array(CheckoutItemSchema), v.minLength(1), v.maxLength(20)),
  customerEmail: v.optional(v.pipe(v.string(), v.trim(), v.email())),
});

export type CheckoutPayload = v.InferOutput<typeof CheckoutPayloadSchema>;
