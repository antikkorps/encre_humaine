// Seed CIBLÉ du run 15 (audit du 2026-09-08) — pousse UNIQUEMENT les champs
// apparus avec ce lot, sur une instance déjà remplie (typiquement la prod).
//
//   pnpm --filter @encre/directus seed:run15            (aperçu, n'écrit rien)
//   pnpm --filter @encre/directus seed:run15 -- --apply (applique)
//
// Sur une instance distante : préfixer par l'env cible (DIRECTUS_URL + creds admin).
//
// Règle absolue : **on n'écrase jamais un champ déjà rempli.** La prod porte le
// texte écrit par Éléonore, qui a divergé du seed depuis longtemps — rejouer le
// seed complet le perdrait (cf. l'incident `booking_url`). Chaque champ n'est
// écrit que s'il est vide. Idempotent : une 2e exécution ne trouve plus rien.

import { get, patch, post } from "./api.ts";
import { run15About, run15CaseStudy, run15Home } from "./content-run15.ts";

const apply = process.argv.includes("--apply");
const act = (msg: string) => console.log(`${apply ? "~" : "·"} ${msg}`);

type Json = Record<string, unknown>;

/** Vide = null, chaîne blanche, ou tableau sans élément. */
function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/** N'écrit que les champs vides du singleton. Renvoie le nombre de champs remplis. */
async function fillEmpty(collection: string, values: Json): Promise<number> {
  const keys = Object.keys(values);
  const current = await get<Json>(`/items/${collection}?fields=${keys.join(",")}`);
  const body: Json = {};
  for (const key of keys) {
    if (isEmpty(current[key])) body[key] = values[key];
    else act(`${collection}.${key} : déjà renseigné, laissé tel quel`);
  }
  if (!Object.keys(body).length) return 0;
  act(`${collection} : ${Object.keys(body).join(", ")}`);
  if (apply) await patch(`/items/${collection}`, body);
  return Object.keys(body).length;
}

/**
 * Lien de chaque bloc « ce que je vous aide à construire » vers sa page d'offre.
 * Les blocs sont dans l'ordre des offres organisations : on complète par position,
 * et jamais un lien déjà saisi.
 */
async function fillBuildLinks(): Promise<void> {
  const home = await get<{ build_blocks: Json[] | null }>("/items/home_page?fields=build_blocks");
  const blocks = home.build_blocks ?? [];
  if (!blocks.length) return console.log("· home_page.build_blocks : aucun bloc, rien à lier");
  const offers = await get<{ slug: string; title: string }[]>(
    "/items/offers?filter[audience][_eq]=organisation&filter[status][_eq]=published" +
      "&sort=sort&limit=-1&fields=slug,title",
  );
  let changed = false;
  const next = blocks.map((block, i) => {
    const offer = offers[i];
    if (!offer || !isEmpty(block.url)) return block;
    changed = true;
    act(`bloc ${i + 1} « ${String(block.title ?? "")} » → /organisations/${offer.slug}`);
    return { ...block, url: `/organisations/${offer.slug}` };
  });
  if (!changed) return console.log("= home_page.build_blocks : liens déjà en place");
  if (apply) await patch("/items/home_page", { build_blocks: next });
}

/** Premier cas concret — créé seulement si la collection est vide. */
async function seedFirstCase(): Promise<void> {
  const existing = await get<{ id: string }[]>("/items/case_studies?limit=1&fields=id");
  if (existing.length) return console.log("= case_studies : déjà alimentée, rien à créer");
  act(`case_studies : création de « ${run15CaseStudy.title} »`);
  if (apply) await post("/items/case_studies", { ...run15CaseStudy, status: "published" });
}

async function main(): Promise<void> {
  console.log(
    apply
      ? "→ Seed run 15 (écriture des champs VIDES uniquement)…"
      : "→ Seed run 15 — APERÇU (rien n'est écrit ; ajouter --apply)…",
  );
  await fillEmpty("home_page", { ...run15Home });
  await fillEmpty("about_page", { ...run15About });
  await fillBuildLinks();
  await seedFirstCase();
  console.log(apply ? "\n✓ Seed run 15 appliqué." : "\n✓ Aperçu terminé.");
}

main().catch((e) => {
  console.error("\n✗ Seed run 15 échoué :", e instanceof Error ? e.message : e);
  process.exit(1);
});
