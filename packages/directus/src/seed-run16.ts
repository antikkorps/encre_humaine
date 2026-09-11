// Seed CIBLÉ du run 16 (mails d'Éléonore du 2026-09-11) — pousse UNIQUEMENT ce que
// ce lot apporte, sur une instance déjà remplie (typiquement la prod).
//
//   pnpm --filter @encre/directus seed:run16            (aperçu, n'écrit rien)
//   pnpm --filter @encre/directus seed:run16 -- --apply (applique)
//
// Sur une instance distante : préfixer par l'env cible (DIRECTUS_URL + creds admin).
//
// Règle absolue : **on n'écrase jamais un champ déjà rempli** (cf. l'incident
// `booking_url`). Deux exceptions assumées, toutes deux explicites et visibles dans
// l'aperçu :
//   - les REMPLACEMENTS ciblés (`run16OrgHubRewrites`) — appliqués seulement si le
//     champ porte encore mot pour mot la valeur d'avant ;
//   - le VIDAGE du constat de la page Carte des Talents, qu'Éléonore demande de
//     faire sauter au profit de la preuve par l'exemple. Son texte est affiché en
//     clair avant d'être retiré.
// Idempotent : une 2e exécution ne trouve plus rien à faire.

import { get, patch, post } from "./api.ts";
import {
  run16CaseOrder,
  run16CaseStudies,
  run16ExistingCaseScopes,
  run16OfferProof,
  run16OrgHub,
  run16OrgHubRewrites,
  run16RetiredBlocks,
} from "./content-run16.ts";

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
 * Remplacements ciblés : un champ n'est réécrit que s'il est vide ou s'il porte
 * ENCORE la valeur d'avant. Tout autre texte = Éléonore est passée par là, on la
 * laisse décider (et on le signale, elle voudra peut-être reprendre la formule).
 */
async function rewriteKnown(
  collection: string,
  rewrites: Record<string, { from: string; to: string }>,
): Promise<void> {
  const keys = Object.keys(rewrites);
  const current = await get<Json>(`/items/${collection}?fields=${keys.join(",")}`);
  const body: Json = {};
  for (const key of keys) {
    const rule = rewrites[key];
    if (!rule) continue;
    const value = typeof current[key] === "string" ? (current[key] as string).trim() : "";
    if (!value || value === rule.from) {
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

/** Affiche (sans rien toucher) le texte des blocs retirés, pour archive. */
async function archiveRetiredBlocks(): Promise<void> {
  const fields = [...run16RetiredBlocks.orgHub];
  const hub = await get<Json>(`/items/org_hub_page?fields=${fields.join(",")}`);
  console.log("\n📋 Blocs retirés du hub Organisations — texte conservé en base, plus affiché :");
  for (const field of fields) {
    const value = hub[field];
    if (isEmpty(value)) continue;
    console.log(`  · org_hub_page.${field} : ${JSON.stringify(value, null, 2)}`);
  }
}

/** Vide le constat de la page Carte des Talents (après l'avoir affiché en clair). */
async function clearOfferContext(): Promise<void> {
  const { slug, fields } = run16RetiredBlocks.offerContext;
  const [offer] = await get<(Json & { id: string })[]>(
    `/items/offers?filter[slug][_eq]=${slug}&limit=1&fields=id,${fields.join(",")}`,
  );
  if (!offer) return console.log(`! offre ${slug} introuvable — constat non vidé`);
  if (fields.every((f) => isEmpty(offer[f]))) {
    return console.log(`= ${slug} : constat déjà vide`);
  }
  console.log(`\n📋 Constat retiré de la page ${slug} (remplacé par la preuve par l'exemple) :`);
  for (const field of fields) {
    if (!isEmpty(offer[field]))
      console.log(`  · ${field} : ${JSON.stringify(offer[field], null, 2)}`);
  }
  act(`${slug} : vidage de ${fields.join(", ")}`);
  if (apply) {
    await patch(`/items/offers/${offer.id}`, Object.fromEntries(fields.map((f) => [f, null])));
  }
}

/** Habillage de la section preuve sur la page d'offre (champs vides uniquement). */
async function fillOfferProof(): Promise<void> {
  const keys = Object.keys(run16OfferProof.values);
  const [offer] = await get<(Json & { id: string })[]>(
    `/items/offers?filter[slug][_eq]=${run16OfferProof.slug}&limit=1&fields=id,${keys.join(",")}`,
  );
  if (!offer) return console.log(`! offre ${run16OfferProof.slug} introuvable`);
  const body: Json = {};
  for (const [key, value] of Object.entries(run16OfferProof.values)) {
    if (isEmpty(offer[key])) body[key] = value;
    else act(`${run16OfferProof.slug}.${key} : déjà renseigné, laissé tel quel`);
  }
  if (!Object.keys(body).length) return;
  act(`${run16OfferProof.slug} : ${Object.keys(body).join(", ")}`);
  if (apply) await patch(`/items/offers/${offer.id}`, body);
}

/** Cas concrets du lot : créés s'ils n'existent pas (clé = le titre). */
async function seedCaseStudies(): Promise<void> {
  for (const study of run16CaseStudies) {
    const existing = await get<{ id: string }[]>(
      `/items/case_studies?filter[title][_eq]=${encodeURIComponent(study.title)}&limit=1&fields=id`,
    );
    if (existing.length) {
      console.log(`= case_studies : « ${study.title} » existe déjà`);
      continue;
    }
    act(`case_studies : création de « ${study.title} »`);
    if (apply) await post("/items/case_studies", { ...study, status: "published" });
  }
  // Le cas du run 15 rejoint la page Carte des Talents (2e des trois cartes).
  const [legacy] = await get<{ id: string; offer_scopes: unknown }[]>(
    `/items/case_studies?filter[title][_eq]=${encodeURIComponent(run16ExistingCaseScopes.title)}` +
      "&limit=1&fields=id,offer_scopes",
  );
  if (!legacy)
    return console.log(`! case_studies : « ${run16ExistingCaseScopes.title} » introuvable`);
  if (!isEmpty(legacy.offer_scopes)) {
    return console.log("= case_studies (run 15) : périmètre d'offre déjà renseigné");
  }
  act(
    `case_studies « ${run16ExistingCaseScopes.title} » → ${run16ExistingCaseScopes.offer_scopes}`,
  );
  if (apply) {
    await patch(`/items/case_studies/${legacy.id}`, {
      offer_scopes: [...run16ExistingCaseScopes.offer_scopes],
    });
  }
}

/** Range les trois cas dans l'ordre du mail (seulement si leur tri est vierge). */
async function orderCaseStudies(): Promise<void> {
  for (const [i, title] of run16CaseOrder.entries()) {
    const [study] = await get<{ id: string; sort: number | null }[]>(
      `/items/case_studies?filter[title][_eq]=${encodeURIComponent(title)}&limit=1&fields=id,sort`,
    );
    if (!study) {
      console.log(`! case_studies : « ${title} » introuvable, tri inchangé`);
      continue;
    }
    if (study.sort !== null && study.sort !== undefined) {
      console.log(`= case_studies : « ${title} » déjà trié (${study.sort})`);
      continue;
    }
    act(`case_studies : « ${title} » → position ${i + 1}`);
    if (apply) await patch(`/items/case_studies/${study.id}`, { sort: i + 1 });
  }
}

/** Rappelle ce que portent les fiches d'offre, pour comparer aux prix du hub. */
async function showOfferPrices(): Promise<void> {
  const offers = await get<{ slug: string; price_label: string; duration_label: string }[]>(
    "/items/offers?filter[audience][_eq]=organisation&filter[status][_eq]=published" +
      "&sort=sort&limit=-1&fields=slug,price_label,duration_label",
  );
  console.log("\n📋 Pour comparaison — investissement/format des fiches d'offre :");
  for (const o of offers) {
    console.log(`  · ${o.slug} : ${o.price_label ?? "—"} · ${o.duration_label ?? "—"}`);
  }
}

async function main(): Promise<void> {
  console.log(
    apply
      ? "→ Seed run 16 (écriture)…"
      : "→ Seed run 16 — APERÇU (rien n'est écrit ; ajouter --apply)…",
  );
  await fillEmpty("org_hub_page", { ...run16OrgHub });
  await rewriteKnown("org_hub_page", run16OrgHubRewrites);
  await fillOfferProof();
  await clearOfferContext();
  await seedCaseStudies();
  await orderCaseStudies();
  await archiveRetiredBlocks();
  await showOfferPrices();
  console.log(apply ? "\n✓ Seed run 16 appliqué." : "\n✓ Aperçu terminé.");
}

main().catch((e) => {
  console.error("\n✗ Seed run 16 échoué :", e instanceof Error ? e.message : e);
  process.exit(1);
});
