// Seed CIBLÉ de la page d'accueil (PATCH `home_page` uniquement) — pousse la
// copie éditoriale de la home (source : content-home.ts) sans aucun collatéral
// sur les autres collections (offres, témoignages, articles…). Utile pour
// appliquer le contenu de la home sur une instance (ex. prod) sans écraser le
// reste. Idempotent. Ne touche PAS `featured_testimonial` (relation à un ID).
//
//   pnpm --filter @encre/directus seed:home
//
// Sur une instance distante : préfixer par l'env cible (DIRECTUS_URL + creds
// admin), comme le bootstrap.

import { patch } from "./api.ts";
import { homePageContent } from "./content-home.ts";

async function main(): Promise<void> {
  console.log("→ Seed home_page (ciblé)…");
  await patch("/items/home_page", homePageContent);
  console.log("✓ home_page mis à jour.");
}

main().catch((e) => {
  console.error("✗ Seed home échoué :", e instanceof Error ? e.message : e);
  process.exit(1);
});
