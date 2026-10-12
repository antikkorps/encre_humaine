// Seed CIBLÉ du run 19 (mail d'Éléonore du 2026-10-12, page Contact) — pousse
// UNIQUEMENT ce que ce lot apporte, sur une instance déjà remplie (typiquement la
// prod).
//
//   pnpm --filter @encre/directus seed:run19            (aperçu, n'écrit rien)
//   pnpm --filter @encre/directus seed:run19 -- --apply (applique)
//
// Le lot ajoute des champs à `contact_page` : `bootstrap` puis `reconcile` AVANT
// ce script (cf. procédure). Sur une instance distante : préfixer par l'env cible
// (DIRECTUS_URL + creds admin).
//
// Règle absolue : on n'écrase jamais un champ déjà rempli. Les deux textes que le
// mail réécrit (`contact_intro`, `booking_intro`) ne sont remplacés que s'ils
// portent encore la formule d'origine. Idempotent : une 2e exécution ne trouve
// plus rien à faire.

import { get, post } from "./api.ts";
import { run19ContactFaq, run19ContactPage, run19ContactRewrites } from "./content-run19.ts";
import { fillEmpty, rewriteKnown } from "./seed-singleton.ts";

const apply = process.argv.includes("--apply");
const act = (msg: string) => console.log(`${apply ? "~" : "·"} ${msg}`);

/** Question de FAQ du lot : créée si absente, rangée après les questions Contact. */
async function seedFaq(): Promise<void> {
  const { question, scope } = run19ContactFaq;
  const existing = await get<{ question: string; sort: number | null }[]>(
    `/items/faq_items?filter[scope][_eq]=${scope}&limit=-1&fields=question,sort`,
  );
  if (existing.some((f) => f.question.trim() === question)) {
    return console.log(`= faq_items : « ${question} » existe déjà`);
  }
  const sort = existing.reduce((max, f) => Math.max(max, f.sort ?? 0), 0) + 1;
  act(`faq_items : création de « ${question} » (${scope}, position ${sort})`);
  if (apply) await post("/items/faq_items", { ...run19ContactFaq, sort, status: "published" });
}

async function main(): Promise<void> {
  console.log(
    apply
      ? "→ Seed run 19 (écriture)…"
      : "→ Seed run 19 — APERÇU (rien n'est écrit ; ajouter --apply)…",
  );
  const options = { apply, act };
  await fillEmpty("contact_page", { ...run19ContactPage }, options);
  await rewriteKnown("contact_page", run19ContactRewrites, options);
  await seedFaq();
  console.log(apply ? "\n✓ Seed run 19 appliqué." : "\n✓ Aperçu terminé.");
}

main().catch((e) => {
  console.error("\n✗ Seed run 19 échoué :", e instanceof Error ? e.message : e);
  process.exit(1);
});
