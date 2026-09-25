// Seed CIBLÉ du run 17 (3 mails d'Éléonore du 2026-09-13) — pousse UNIQUEMENT ce que
// ce lot apporte, sur une instance déjà remplie (typiquement la prod).
//
//   pnpm --filter @encre/directus seed:run17            (aperçu, n'écrit rien)
//   pnpm --filter @encre/directus seed:run17 -- --apply (applique)
//
// À lancer APRÈS `bootstrap` puis `reconcile` : le lot ajoute des champs
// (`case_studies.show_on_home`, pied des cartes du hub Particuliers).
// Sur une instance distante : préfixer par l'env cible (DIRECTUS_URL + creds admin).
//
// Règle absolue : **on n'écrase jamais un champ déjà rempli** (cf. l'incident
// `booking_url`). Seule exception, explicite et visible dans l'aperçu : le VIDAGE
// du constat des pages Audit RH et De l'Expert au Manager, qu'Éléonore demande de
// faire sauter au profit de la preuve par l'exemple. Leur texte est affiché en
// clair avant d'être retiré.
// Idempotent : une 2e exécution ne trouve plus rien à faire.

import { get, patch } from "./api.ts";
import { run17B2cHub, run17CaseStudies, run17RetiredOfferContext } from "./content-run17.ts";
import { seedCaseStudies } from "./seed-case-studies.ts";

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

/** N'écrit que les champs vides du singleton. */
async function fillEmpty(collection: string, values: Json): Promise<void> {
  const keys = Object.keys(values);
  const current = await get<Json>(`/items/${collection}?fields=${keys.join(",")}`);
  const body: Json = {};
  for (const key of keys) {
    if (isEmpty(current[key])) body[key] = values[key];
    else act(`${collection}.${key} : déjà renseigné, laissé tel quel`);
  }
  if (!Object.keys(body).length) return;
  act(`${collection} : ${Object.keys(body).join(", ")}`);
  if (apply) await patch(`/items/${collection}`, body);
}

/** Vide le constat des deux pages d'offre (après l'avoir affiché en clair). */
async function clearOfferContexts(): Promise<void> {
  const { slugs, fields } = run17RetiredOfferContext;
  for (const slug of slugs) {
    const [offer] = await get<(Json & { id: string })[]>(
      `/items/offers?filter[slug][_eq]=${slug}&limit=1&fields=id,${fields.join(",")}`,
    );
    if (!offer) {
      console.log(`! offre ${slug} introuvable — constat non vidé`);
      continue;
    }
    if (fields.every((f) => isEmpty(offer[f]))) {
      console.log(`= ${slug} : constat déjà vide`);
      continue;
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
}

/**
 * Le hub Particuliers annonce désormais un montant par carte. Les fiches d'offre,
 * elles, portent encore le leur : si les deux divergent, le visiteur le voit. On
 * les affiche côte à côte pour qu'Éléonore tranche (l'alignement se fait dans
 * l'admin ; un champ prix vidé sur la carte reprend celui de la fiche).
 */
async function compareB2cPrices(): Promise<void> {
  const offers = await get<{ slug: string; price_label: string; duration_label: string }[]>(
    "/items/offers?filter[audience][_eq]=particulier&filter[status][_eq]=published" +
      "&sort=sort&limit=-1&fields=slug,price_label,duration_label",
  );
  console.log("\n📋 À comparer — ce qu'annonce le hub vs la fiche d'offre :");
  const cards = [
    {
      slug: "clarifier-son-projet",
      price: run17B2cHub.situation_a_price,
      duration: run17B2cHub.situation_a_duration,
    },
    {
      slug: "se-repositionner",
      price: run17B2cHub.situation_b_price,
      duration: run17B2cHub.situation_b_duration,
    },
  ];
  for (const card of cards) {
    const offer = offers.find((o) => o.slug === card.slug);
    console.log(`  · ${card.slug}`);
    console.log(`      hub   : ${card.price} · ${card.duration}`);
    console.log(`      fiche : ${offer?.price_label ?? "—"} · ${offer?.duration_label ?? "—"}`);
  }
}

async function main(): Promise<void> {
  console.log(
    apply
      ? "→ Seed run 17 (écriture)…"
      : "→ Seed run 17 — APERÇU (rien n'est écrit ; ajouter --apply)…",
  );
  await fillEmpty("b2c_hub_page", { ...run17B2cHub });
  await clearOfferContexts();
  await seedCaseStudies(run17CaseStudies, { apply, act });
  await compareB2cPrices();
  console.log(apply ? "\n✓ Seed run 17 appliqué." : "\n✓ Aperçu terminé.");
}

main().catch((e) => {
  console.error("\n✗ Seed run 17 échoué :", e instanceof Error ? e.message : e);
  process.exit(1);
});
