// Seed CIBLÉ du run 21 (mail d'Éléonore du 2026-10-26) — cartes résumées des cas
// concrets de l'accueil, Qualiopi à la place du plan de formation, textes des
// invitations au diagnostic.
//
//   pnpm --filter @encre/directus seed:run21            (aperçu, n'écrit rien)
//   pnpm --filter @encre/directus seed:run21 -- --apply (applique)
//
// Le lot ajoute des champs (`case_studies.teaser_*`, `diagnostic_*.promo_*`) :
// `bootstrap` puis `reconcile` AVANT ce script.
//
// Règle absolue : on n'écrase jamais un champ déjà rempli. Idempotent.

import { pathToFileURL } from "node:url";
import { get, patch } from "./api.ts";
import { run21CaseTeasers, run21HomeSwap, run21QualiopiTitle } from "./content-run21.ts";
import { seedDiagnosticTexts } from "./seed-diagnostics.ts";
import { isEmpty } from "./seed-singleton.ts";

type Options = { apply: boolean; act: (msg: string) => void };
type CaseRow = Record<string, unknown> & { id: string; title: string; show_on_home: boolean };

const TEASER_FIELDS = ["teaser_label", "teaser_situation", "teaser_result", "teaser_button"];

const loadCases = () =>
  get<CaseRow[]>(
    `/items/case_studies?limit=-1&fields=id,title,show_on_home,${TEASER_FIELDS.join(",")}`,
  );

const findCase = (cases: CaseRow[], starts: string[]) =>
  cases.find((c) => starts.some((s) => c.title.trim().startsWith(s)));

/** Titre repris de la carte d'Éléonore, seulement s'il porte encore l'ancien. */
async function renameQualiopi(cases: CaseRow[], { apply, act }: Options): Promise<void> {
  const found = cases.find((c) => c.title.trim() === run21QualiopiTitle.from);
  if (!found) return console.log("= case_studies : titre Qualiopi déjà changé (ou absent)");
  act(`case_studies « ${found.title} » → « ${run21QualiopiTitle.to} »`);
  if (apply) await patch(`/items/case_studies/${found.id}`, { title: run21QualiopiTitle.to });
}

/** Cartes résumées : seuls les champs vides sont remplis. */
async function seedTeasers(cases: CaseRow[], { apply, act }: Options): Promise<void> {
  for (const { match, ...teaser } of run21CaseTeasers) {
    const found = findCase(cases, match);
    if (!found) {
      console.log(`! case_studies « ${match[0]} » introuvable`);
      continue;
    }
    const body = Object.fromEntries(Object.entries(teaser).filter(([key]) => isEmpty(found[key])));
    if (!Object.keys(body).length) {
      console.log(`= case_studies « ${found.title} » : carte résumée déjà renseignée`);
      continue;
    }
    act(`case_studies « ${found.title} » : ${Object.keys(body).join(", ")}`);
    if (apply) await patch(`/items/case_studies/${found.id}`, body);
  }
}

/**
 * Accueil : Qualiopi entre, le plan de formation sort (case « accueil »). Échange
 * ponctuel : il n'a lieu que si les deux cas sont encore dans leur état d'avant
 * le run 21 — un choix refait ensuite par Éléonore n'est jamais défait.
 */
async function swapHomeCases(cases: CaseRow[], { apply, act }: Options): Promise<void> {
  const show = findCase(cases, [run21HomeSwap.show, run21QualiopiTitle.from]);
  const hide = findCase(cases, [run21HomeSwap.hide]);
  if (!show || !hide)
    return console.log("! case_studies : Qualiopi ou plan de formation introuvable");
  if (show.show_on_home || !hide.show_on_home) {
    return console.log("= case_studies : accueil déjà réglé, laissé tel quel");
  }
  act(`case_studies « ${show.title} » : accueil → oui ; « ${hide.title} » : accueil → non`);
  if (!apply) return;
  await patch(`/items/case_studies/${show.id}`, { show_on_home: true });
  await patch(`/items/case_studies/${hide.id}`, { show_on_home: false });
}

export async function seedRun21(options: Options): Promise<void> {
  const cases = await loadCases();
  await seedTeasers(cases, options);
  await renameQualiopi(cases, options);
  await swapHomeCases(cases, options);
  await seedDiagnosticTexts(options);
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");
  const act = (msg: string) => console.log(`${apply ? "~" : "·"} ${msg}`);
  console.log(
    apply
      ? "→ Seed run 21 (écriture)…"
      : "→ Seed run 21 — APERÇU (rien n'est écrit ; ajouter --apply)…",
  );
  await seedRun21({ apply, act });
  console.log(apply ? "\n✓ Seed run 21 appliqué." : "\n✓ Aperçu terminé.");
}

// Exécuté seulement en script : le seed complet l'importe sans le lancer.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((e) => {
    console.error("\n✗ Seed run 21 échoué :", e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
