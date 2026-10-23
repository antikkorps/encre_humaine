/**
 * Aides au balisage schema.org (JSON-LD) des pages d'offre.
 *
 * Le prix vit dans un champ texte libre (`price_label`) qu'Éléonore rédige à sa
 * façon (« Tarif : à partir de 4 000 € », « 900€ », « sur devis »). On en extrait
 * le premier montant pour le balisage `Service` ; sans montant, pas de prix
 * balisé plutôt qu'un prix inventé.
 */

/**
 * Premier montant d'un libellé : séparateur de milliers espace ou point, virgule
 * décimale FR. Le PREMIER, car « de 500 à 900 € » a pour plancher 500.
 */
const AMOUNT_RE = /(\d{1,3}(?:[\s  .]\d{3})+|\d+)(?:,(\d{1,2}))?/;

export function parseStartingPrice(label: string | null | undefined): number | null {
  // Sans euro ce n'est pas un prix (« 6 mois ») ; « sur devis » l'emporte sur
  // tout montant indicatif : mieux vaut aucun prix balisé qu'un prix contesté.
  if (!label?.includes("€") || /devis/i.test(label)) return null;
  const match = label.match(AMOUNT_RE);
  if (!match?.[1]) return null;
  const units = match[1].replace(/[\s  .]/g, "");
  return Number(match[2] ? `${units}.${match[2]}` : units);
}
