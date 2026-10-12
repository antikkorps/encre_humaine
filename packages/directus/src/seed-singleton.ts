// Écritures prudentes sur un singleton pour les seeds ciblés (run 19…) — partagé
// pour que la règle « on n'écrase jamais le texte d'Éléonore » ne vive qu'à un
// endroit (cf. l'incident `booking_url`). Sans `apply`, rien n'est écrit : on se
// contente d'annoncer (`act`).

import { get, patch } from "./api.ts";

type Json = Record<string, unknown>;
type Options = { apply: boolean; act: (msg: string) => void };

/** Vide = null, chaîne blanche, ou tableau sans élément. */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/** N'écrit que les champs vides du singleton. */
export async function fillEmpty(
  collection: string,
  values: Json,
  { apply, act }: Options,
): Promise<void> {
  const keys = Object.keys(values);
  const current = await get<Json>(`/items/${collection}?fields=${keys.join(",")}`);
  const body: Json = {};
  for (const key of keys) {
    if (isEmpty(current[key])) body[key] = values[key];
    else console.log(`= ${collection}.${key} : déjà renseigné, laissé tel quel`);
  }
  if (!Object.keys(body).length) return;
  act(`${collection} : ${Object.keys(body).join(", ")}`);
  if (apply) await patch(`/items/${collection}`, body);
}

/**
 * Remplacements ciblés : un champ n'est réécrit que s'il est vide ou s'il porte
 * ENCORE la valeur d'avant. Tout autre texte = Éléonore est passée par là : on
 * la laisse décider et on affiche la proposition, qu'elle peut reprendre.
 */
export async function rewriteKnown(
  collection: string,
  rewrites: Record<string, { from: string; to: string }>,
  { apply, act }: Options,
): Promise<void> {
  const keys = Object.keys(rewrites);
  const current = await get<Json>(`/items/${collection}?fields=${keys.join(",")}`);
  const body: Json = {};
  for (const key of keys) {
    const rule = rewrites[key];
    if (!rule) continue;
    const value = typeof current[key] === "string" ? (current[key] as string).trim() : "";
    if (value === rule.to) {
      console.log(`= ${collection}.${key} : déjà à jour`);
    } else if (!value || value === rule.from) {
      body[key] = rule.to;
      act(`${collection}.${key} → « ${rule.to} »`);
    } else {
      console.log(
        `! ${collection}.${key} : texte différent de celui attendu, laissé tel quel\n` +
          `    actuel  : « ${value} »\n` +
          `    proposé : « ${rule.to} »`,
      );
    }
  }
  if (apply && Object.keys(body).length) await patch(`/items/${collection}`, body);
}
