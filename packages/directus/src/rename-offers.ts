// Migration CIBLÉE du run 15 — renommage des offres (audit du 2026-09-08).
//
//   pnpm --filter @encre/directus rename:offers            (aperçu, n'écrit rien)
//   pnpm --filter @encre/directus rename:offers -- --apply (applique)
//
// Sur une instance distante : préfixer par l'env cible (DIRECTUS_URL + creds admin),
// comme le bootstrap.
//
// Pourquoi un script et pas un seed : le slug d'une offre est une CLÉ. Il apparaît
// dans l'URL publique, mais aussi dans `testimonials.offer_scopes` (les valeurs
// stockées SONT des slugs) et dans les liens de CTA saisis sur les hubs. Rejouer
// le seed complet écraserait par ailleurs tout le contenu qu'Éléonore a écrit
// depuis (cf. l'incident `booking_url`). Ce script ne touche que ce qui doit bouger,
// et il est idempotent : une 2e exécution ne trouve plus rien à faire.
//
// Les anciennes URLs restent servies : `routeRules` (apps/web/nuxt.config.ts) les
// redirige en 301 vers les nouvelles.

import { get, patch } from "./api.ts";
import { OFFER_RENAMES as RENAMES } from "./content-run15.ts";
import { allCollections } from "./schema.ts";

/** Renommages de titre seuls (le slug était déjà bon). */
const TITLE_ONLY: Record<string, string> = { "audit-rh": "Audit RH" };
/**
 * Clés d'icône : `offers.icon` était une saisie libre jamais affichée. Elle sert
 * désormais au menu déroulant, donc elle doit valoir une clé du jeu fermé
 * (ICON_CHOICES) — sinon rond vide dans la nav.
 */
const ICONS: Record<string, string> = {
  "audit-rh": "visibility",
  "carte-des-talents": "route",
  "de-l-expert-au-manager": "groups",
  "clarifier-son-projet": "explore",
  "se-repositionner": "rocket-launch",
};

const apply = process.argv.includes("--apply");
const act = (msg: string) => console.log(`${apply ? "~" : "·"} ${msg}`);

type Offer = { id: string; slug: string; title: string; icon: string | null };
type Testimonial = { id: string; offer_scopes: unknown };
type Hub = Record<string, unknown>;

/** Remplace un ancien slug par le nouveau dans une URL d'offre. */
function rewriteLink(value: unknown): string | null {
  if (typeof value !== "string") return null;
  for (const [from, to] of Object.entries(RENAMES)) {
    if (value.includes(`/${from}`)) return value.replace(`/${from}`, `/${to.slug}`);
  }
  return null;
}

async function migrateOffers(): Promise<void> {
  const offers = await get<Offer[]>("/items/offers?fields=id,slug,title,icon&limit=-1");
  for (const offer of offers) {
    const rename = RENAMES[offer.slug];
    const body: Record<string, string> = {};
    if (rename) {
      body.slug = rename.slug;
      body.title = rename.title;
    } else {
      const title = TITLE_ONLY[offer.slug];
      if (title && offer.title !== title) body.title = title;
    }
    const wantIcon = ICONS[body.slug ?? offer.slug];
    if (wantIcon && offer.icon !== wantIcon) body.icon = wantIcon;
    if (!Object.keys(body).length) continue;
    act(`offre ${offer.slug} → ${JSON.stringify(body)}`);
    if (apply) await patch(`/items/offers/${offer.id}`, body);
  }
}

async function migrateTestimonialScopes(): Promise<void> {
  const items = await get<Testimonial[]>("/items/testimonials?fields=id,offer_scopes&limit=-1");
  for (const t of items) {
    if (!Array.isArray(t.offer_scopes)) continue;
    const next = t.offer_scopes.map((s) =>
      typeof s === "string" && RENAMES[s] ? RENAMES[s].slug : s,
    );
    if (JSON.stringify(next) === JSON.stringify(t.offer_scopes)) continue;
    act(
      `témoignage ${t.id} : périmètres ${JSON.stringify(t.offer_scopes)} → ${JSON.stringify(next)}`,
    );
    if (apply) await patch(`/items/testimonials/${t.id}`, { offer_scopes: next });
  }
}

/**
 * Liens de CTA saisis sur les hubs (« situation A/B/C ») pointant une offre.
 * Le nombre de situations diffère d'un hub à l'autre — trois côté organisations,
 * deux côté particuliers — donc on lit la liste dans `schema.ts` plutôt que de la
 * répéter ici : demander un champ inexistant vaut un 403 à Directus.
 */
async function migrateHubLinks(): Promise<void> {
  for (const collection of ["org_hub_page", "b2c_hub_page"]) {
    const def = allCollections.find((c) => c.collection === collection);
    const fields = (def?.fields ?? [])
      .map((f) => f.field)
      .filter((f) => /^situation_[a-z]_cta_link$/.test(f));
    if (!fields.length) continue;
    const hub = await get<Hub>(`/items/${collection}?fields=${fields.join(",")}`);
    const body: Record<string, string> = {};
    for (const f of fields) {
      const next = rewriteLink(hub[f]);
      if (next) body[f] = next;
    }
    if (!Object.keys(body).length) continue;
    act(`${collection} : ${JSON.stringify(body)}`);
    if (apply) await patch(`/items/${collection}`, body);
  }
}

/**
 * Les anciennes URLs peuvent aussi vivre dans du texte riche (articles, corps
 * d'offres). On ne les réécrit PAS automatiquement — un remplacement aveugle dans
 * du HTML éditorial est trop risqué — mais on les signale : les 301 les couvrent,
 * il s'agit juste de savoir où repasser à l'occasion.
 */
async function reportRichTextLinks(): Promise<void> {
  const olds = Object.keys(RENAMES);
  const filter = encodeURIComponent(
    JSON.stringify({ _or: olds.map((s) => ({ body: { _contains: `/${s}` } })) }),
  );
  const articles = await get<{ slug: string }[]>(
    `/items/articles?fields=slug&limit=-1&filter=${filter}`,
  );
  if (articles.length) {
    console.log(
      `\n⚠ ${articles.length} article(s) contiennent encore une ancienne URL d'offre (les 301 les couvrent) :`,
    );
    for (const a of articles) console.log(`  – /ressources/${a.slug}`);
  }
}

async function main(): Promise<void> {
  console.log(
    apply
      ? "→ Renommage des offres (écriture)…"
      : "→ Renommage des offres — APERÇU (rien n'est écrit ; ajouter --apply)…",
  );
  await migrateOffers();
  await migrateTestimonialScopes();
  await migrateHubLinks();
  await reportRichTextLinks();
  console.log(apply ? "\n✓ Renommage appliqué." : "\n✓ Aperçu terminé.");
}

main().catch((e) => {
  console.error("\n✗ Renommage échoué :", e instanceof Error ? e.message : e);
  process.exit(1);
});
