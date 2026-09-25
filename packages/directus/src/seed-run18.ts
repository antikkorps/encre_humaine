// Seed CIBLÉ du run 18 (2 mails d'Éléonore du 2026-09-25) — pousse UNIQUEMENT ce que
// ce lot apporte, sur une instance déjà remplie (typiquement la prod).
//
//   pnpm --filter @encre/directus seed:run18            (aperçu, n'écrit rien)
//   pnpm --filter @encre/directus seed:run18 -- --apply (applique)
//
// Le lot ne touche pas au schéma : ni `bootstrap` ni `reconcile` ne sont requis.
// Sur une instance distante : préfixer par l'env cible (DIRECTUS_URL + creds admin).
//
// Il ne fait que CRÉER les six cas concrets des pages Clarifier son projet et
// Se (re)positionner : un cas déjà présent (même titre) n'est jamais réécrit.
// Idempotent : une 2e exécution ne trouve plus rien à faire.

import { run18CaseStudies } from "./content-run18.ts";
import { seedCaseStudies } from "./seed-case-studies.ts";

const apply = process.argv.includes("--apply");
const act = (msg: string) => console.log(`${apply ? "~" : "·"} ${msg}`);

async function main(): Promise<void> {
  console.log(
    apply
      ? "→ Seed run 18 (écriture)…"
      : "→ Seed run 18 — APERÇU (rien n'est écrit ; ajouter --apply)…",
  );
  await seedCaseStudies(run18CaseStudies, { apply, act });
  console.log(apply ? "\n✓ Seed run 18 appliqué." : "\n✓ Aperçu terminé.");
}

main().catch((e) => {
  console.error("\n✗ Seed run 18 échoué :", e instanceof Error ? e.message : e);
  process.exit(1);
});
