// Seed CIBLÉ du run 20 (mails d'Éléonore du 2026-10-22, travail SEO) — pousse
// UNIQUEMENT ce que ce lot apporte, sur une instance déjà remplie (typiquement la
// prod).
//
//   pnpm --filter @encre/directus seed:run20            (aperçu, n'écrit rien)
//   pnpm --filter @encre/directus seed:run20 -- --apply (applique)
//
// Le lot ajoute des champs (`home_page`, `site_settings`, `offers`) et le
// périmètre de FAQ « home » : `bootstrap` puis `reconcile` AVANT ce script.
//
// Règle absolue : on n'écrase jamais un champ déjà rempli. Idempotent.

import { get, patch, post } from "./api.ts";
import {
  run20Author,
  run20BuildLinkLabels,
  run20FurtherLinks,
  run20HomeFaq,
  run20HomeRewrites,
} from "./content-run20.ts";
import { fillEmpty, isEmpty, rewriteKnown } from "./seed-singleton.ts";

const apply = process.argv.includes("--apply");
const act = (msg: string) => console.log(`${apply ? "~" : "·"} ${msg}`);
const options = { apply, act };

type Json = Record<string, unknown>;

/** Texte de lien des cartes de l'accueil : seulement là où il est vide. */
async function seedBuildLinkLabels(): Promise<void> {
  const home = await get<{ build_blocks: Json[] | null }>("/items/home_page?fields=build_blocks");
  let changed = false;
  const blocks = (home.build_blocks ?? []).map((block) => {
    const label = run20BuildLinkLabels[String(block.url ?? "")];
    if (!label || !isEmpty(block.link_label)) return block;
    act(`home_page.build_blocks « ${block.title} » : lien « ${label} »`);
    changed = true;
    return { ...block, link_label: label };
  });
  if (!changed) return console.log("= home_page.build_blocks : textes de lien déjà renseignés");
  if (apply) await patch("/items/home_page", { build_blocks: blocks });
}

/** Photo de la signature = portrait de l'accueil, si aucune n'est choisie. */
async function seedAuthor(): Promise<void> {
  await fillEmpty("site_settings", { ...run20Author }, options);
  const home = await get<{ intro_photo: string | null }>("/items/home_page?fields=intro_photo");
  if (home.intro_photo)
    await fillEmpty("site_settings", { author_photo: home.intro_photo }, options);
}

/** FAQ de l'accueil : chaque question absente est créée, à la suite. */
async function seedHomeFaq(): Promise<void> {
  const existing = await get<{ question: string; sort: number | null }[]>(
    "/items/faq_items?filter[scope][_eq]=home&limit=-1&fields=question,sort",
  );
  let next = existing.reduce((max, f) => Math.max(max, f.sort ?? 0), 0) + 1;
  for (const faq of run20HomeFaq) {
    if (existing.some((f) => f.question.trim() === faq.question)) {
      console.log(`= faq_items (home) : « ${faq.question} » existe déjà`);
      continue;
    }
    act(`faq_items (home) : création de « ${faq.question} » (position ${next})`);
    if (apply) await post("/items/faq_items", { ...faq, sort: next, status: "published" });
    next += 1;
  }
}

type CaseRef = { id: string; title: string };
type FurtherLink = (typeof run20FurtherLinks)[string][number];

/**
 * URL d'un cas concret sur sa page d'offre, retrouvé par le début de son titre.
 * Les offres ciblées par ce lot sont toutes côté organisations.
 */
function caseUrl(cases: CaseRef[], titleStart: string, offerSlug: string): string | null {
  const found = cases.find((c) => c.title.trim().startsWith(titleStart));
  return found ? `/organisations/${offerSlug}#cas-${found.id}` : null;
}

function resolveLink(link: FurtherLink, cases: CaseRef[]): Json | null {
  const url = link.url ?? caseUrl(cases, link.caseTitle ?? "", link.caseOffer ?? "");
  return url ? { title: link.title, body: link.body, url } : null;
}

/**
 * « Pour aller plus loin » : rempli seulement sur les offres qui n'en ont pas, et
 * jamais à moitié : un lien introuvable laisse l'offre vide, donc rejouable.
 */
async function seedFurtherLinks(): Promise<void> {
  const cases = await get<CaseRef[]>("/items/case_studies?limit=-1&fields=id,title");
  for (const [slug, links] of Object.entries(run20FurtherLinks)) {
    const [offer] = await get<{ id: string; further_links: Json[] | null }[]>(
      `/items/offers?filter[slug][_eq]=${slug}&fields=id,further_links`,
    );
    if (!offer) {
      console.log(`! offers « ${slug} » introuvable`);
      continue;
    }
    if (!isEmpty(offer.further_links)) {
      console.log(`= offers « ${slug} » : « Pour aller plus loin » déjà renseigné`);
      continue;
    }
    const value = links.map((link) => resolveLink(link, cases));
    if (value.some((l) => l === null)) {
      console.log(`! offers « ${slug} » : un cas lié est introuvable, rien n'est écrit`);
      continue;
    }
    act(`offers « ${slug} » : ${value.map((l) => `« ${l?.title} » → ${l?.url}`).join(", ")}`);
    if (apply) await patch(`/items/offers/${offer.id}`, { further_links: value });
  }
}

async function main(): Promise<void> {
  console.log(
    apply
      ? "→ Seed run 20 (écriture)…"
      : "→ Seed run 20 — APERÇU (rien n'est écrit ; ajouter --apply)…",
  );
  await rewriteKnown("home_page", run20HomeRewrites, options);
  await seedBuildLinkLabels();
  await seedAuthor();
  await seedHomeFaq();
  await seedFurtherLinks();
  console.log(apply ? "\n✓ Seed run 20 appliqué." : "\n✓ Aperçu terminé.");
}

main().catch((e) => {
  console.error("\n✗ Seed run 20 échoué :", e instanceof Error ? e.message : e);
  process.exit(1);
});
