/**
 * Aides au balisage schema.org (JSON-LD) des pages d'offre.
 *
 * Le prix vit dans un champ texte libre (`price_label`) qu'Éléonore rédige à sa
 * façon (« Tarif : à partir de 4 000 € », « 900€ », « sur devis »). On en extrait
 * le premier montant pour le balisage `Service` ; sans montant, pas de prix
 * balisé plutôt qu'un prix inventé.
 */

/** Premier montant en euros d'un libellé, espaces de milliers et virgule décimale FR compris. */
const AMOUNT_RE = /(\d{1,3}(?:[\s  ]\d{3})+|\d+)(?:,(\d{1,2}))?\s*€/;

export function parseStartingPrice(label: string | null | undefined): number | null {
  const match = label?.match(AMOUNT_RE);
  if (!match?.[1]) return null;
  const units = match[1].replace(/[\s  ]/g, "");
  return Number(match[2] ? `${units}.${match[2]}` : units);
}
