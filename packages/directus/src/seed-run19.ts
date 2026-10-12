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

import { get, patch, post } from "./api.ts";
import { run19ContactFaq, run19ContactPage, run19ContactRewrites } from "./content-run19.ts";
import { fillEmpty, rewriteKnown } from "./seed-singleton.ts";

const apply = process.argv.includes("--apply");
const act = (msg: string) => console.log(`${apply ? "~" : "·"} ${msg}`);

/**
 * Question de FAQ du lot : créée si absente, en DERNIÈRE position (ordre du mail).
 * Une question jamais triée (sort NULL) est rangée après les autres par Postgres,
 * dans un ordre non garanti : la nouvelle s'y intercalerait au hasard. On fige donc
 * d'abord l'ordre affiché aujourd'hui en numérotant les questions sans tri (seul
 * `sort` est écrit, jamais leur texte), puis on ajoute la nouvelle à la suite.
 */
async function seedFaq(): Promise<void> {
  const { question, scope } = run19ContactFaq;
  const existing = await get<{ id: string; question: string; sort: number | null }[]>(
    `/items/faq_items?filter[scope][_eq]=${scope}&sort=sort&limit=-1&fields=id,question,sort`,
  );
  if (existing.some((f) => f.question.trim() === question)) {
    return console.log(`= faq_items : « ${question} » existe déjà`);
  }
  let next = existing.reduce((max, f) => Math.max(max, f.sort ?? 0), 0) + 1;
  for (const faq of existing.filter((f) => f.sort === null || f.sort === undefined)) {
    act(`faq_items : « ${faq.question} » sans tri → position ${next}`);
    if (apply) await patch(`/items/faq_items/${faq.id}`, { sort: next });
    next += 1;
  }
  act(`faq_items : création de « ${question} » (${scope}, position ${next})`);
  if (apply) {
    await post("/items/faq_items", { ...run19ContactFaq, sort: next, status: "published" });
  }
  console.log(`\n📋 FAQ Contact, dans l'ordre affiché après le lot :`);
  for (const faq of [...existing, { question }]) console.log(`  · ${faq.question}`);
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
