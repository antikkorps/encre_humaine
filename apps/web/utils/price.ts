/**
 * Formatage prix pour l'affichage (FR). Le montant vient TOUJOURS de Stripe en
 * centimes (`unit_amount`) — jamais de prix en dur (docs/05 §8). Phase 1 : EUR.
 */
export function formatPrice(unitAmount: number, currency: string): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(unitAmount / 100);
}
