import { readItems, readSingleton } from "@directus/sdk";
import type { Audience } from "@encre/shared/validation";
import type { FaqItem, TestimonialItem } from "~/types/content";
import {
  asAudience,
  type ContentSeo,
  type FileField,
  mapFaqItems,
  mapSeo,
  mapStringList,
  mapTestimonialItem,
  mapTitledItems,
  type RawSiteDefaults,
  str,
  type TitledItem,
} from "./_shared";

/**
 * Gabarit page Offre (B2B & B2C) — docs/05-offres-gabarit.md.
 * **Une seule implémentation** sert les 5 offres (DRY) : `loadOfferContent(slug)`
 * lit l'offre publiée par `slug` (les slugs sont uniques tous publics confondus),
 * sa FAQ par `scope`, son témoignage vedette et les défauts SEO. La page route
 * (`/organisations/[slug]` ou `/particuliers/[slug]`) vérifie que `audience`
 * correspond, sinon 404 (cf. `OfferPage.vue`).
 *
 * `format_body` est du `input-rich-text-html` → **assaini côté serveur** au fetch
 * (docs/06 §1) via le `sanitize` *injecté* dans le mapper pur (testable sans la dép).
 * Renvoie `null` si aucune offre publiée ne porte ce slug → l'endpoint répond 404.
 */

/** Sous-ensemble `offers` consommé par le gabarit (cf. schema.gen Offers). */
export interface RawOfferFull {
  title?: string | null;
  slug?: string | null;
  audience?: string | null;
  duration_label?: string | null;
  price_label?: string | null;
  price_note?: string | null;
  accroche_title?: string | null;
  accroche_subtitle?: string | null;
  accroche_body?: string | null;
  accroche_signature?: string | null;
  outcomes_title?: string | null;
  outcomes_intro?: string | null;
  outcomes?: unknown; // répéteur { title, body }
  context_title?: string | null;
  context_items?: unknown; // répéteur { title, body }
  context_conclusion?: string | null;
  mission_title?: string | null;
  mission_includes?: unknown; // répéteur { title, body }
  format_body?: string | null; // rich text
  audience_fit_title?: string | null;
  audience_fit?: unknown; // répéteur { text }
  audience_fit_conclusion?: string | null;
  featured_testimonial?: unknown; // m2o testimonials (résolu) ou string
  cta_title?: string | null;
  cta_body?: string | null;
  cta_label?: string | null;
  cta_subtext?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_image?: FileField;
  no_index?: boolean | null;
}

export interface OfferContent {
  /** Public de l'offre ; la page route vérifie la correspondance (sinon 404). */
  audience: Audience | null;
  /** Source du `h1` (null = fallback d'affichage). */
  accrocheTitle: string | null;
  accrocheSubtitle: string | null;
  accrocheBody: string | null;
  accrocheSignature: string | null;
  /** « Ce que ça change » (bénéfices). */
  outcomesTitle: string | null;
  outcomesIntro: string | null;
  outcomes: TitledItem[];
  /** « Ce que je vois souvent » (contexte récurrent). */
  context: { title: string; items: TitledItem[]; conclusion: string | null } | null;
  /** « Ce que comprend la mission » (titre + items titre/corps). */
  missionTitle: string | null;
  missionIncludes: TitledItem[];
  /** « Comment ça se passe » (optionnel) — assaini ; "" si vide. */
  formatBodyHtml: string;
  /** « Pour qui » (liste + conclusion). */
  audienceFitTitle: string | null;
  audienceFit: string[];
  audienceFitConclusion: string | null;
  durationLabel: string | null;
  /** « Investissement » — libellé libre, jamais un montant calculé. */
  priceLabel: string | null;
  priceNote: string | null;
  faq: FaqItem[];
  testimonial: TestimonialItem | null;
  /** CTA final ; `ctaLabel` toujours présent (garde-fou d'affichage). */
  ctaTitle: string | null;
  ctaBody: string | null;
  ctaLabel: string;
  ctaSubtext: string | null;
  seo: ContentSeo;
}

/** Signature du sanitizer injecté (cf. `sanitizeRichText`). */
type Sanitize = (html?: string | null) => string;

/**
 * Scope `faq_items` par slug d'offre (docs/02 §5, docs/05). Les choix `scope`
 * (`audit`/`competences`/`managers`/`b2c`/`general`) couvrent les 5 offres ;
 * `general` (transverse) est toujours ajouté. Slug inconnu → seulement `general`.
 */
export const FAQ_SCOPE_BY_SLUG: Record<string, string> = {
  "audit-rh": "audit",
  "competences-parcours": "competences",
  "managers-equipes": "managers",
  "clarifier-avancer": "b2c",
  "booster-recherche": "b2c",
};

/** Scopes de FAQ à charger pour une offre (spécifique + transverse). */
export function faqScopesForSlug(slug: string): string[] {
  const specific = FAQ_SCOPE_BY_SLUG[slug];
  return specific ? [specific, "general"] : ["general"];
}

/** Compose le payload de l'offre (pur ; `sanitize` injecté pour le rich text). */
export function mapOfferContent(
  raw: RawOfferFull,
  faqRaw: unknown,
  settings: RawSiteDefaults,
  assetBase: string,
  sanitize: Sanitize,
): OfferContent {
  const contextItems = mapTitledItems(raw.context_items);
  const contextTitle = str(raw.context_title);
  const contextConclusion = str(raw.context_conclusion);
  return {
    audience: asAudience(raw.audience) ?? null,
    accrocheTitle: str(raw.accroche_title) || null,
    accrocheSubtitle: str(raw.accroche_subtitle) || null,
    accrocheBody: str(raw.accroche_body) || null,
    accrocheSignature: str(raw.accroche_signature) || null,
    outcomesTitle: str(raw.outcomes_title) || null,
    outcomesIntro: str(raw.outcomes_intro) || null,
    outcomes: mapTitledItems(raw.outcomes),
    context:
      contextTitle || contextItems.length || contextConclusion
        ? { title: contextTitle, items: contextItems, conclusion: contextConclusion || null }
        : null,
    missionTitle: str(raw.mission_title) || null,
    missionIncludes: mapTitledItems(raw.mission_includes),
    formatBodyHtml: sanitize(raw.format_body),
    audienceFitTitle: str(raw.audience_fit_title) || null,
    audienceFit: mapStringList(raw.audience_fit),
    audienceFitConclusion: str(raw.audience_fit_conclusion) || null,
    durationLabel: str(raw.duration_label) || null,
    priceLabel: str(raw.price_label) || null,
    priceNote: str(raw.price_note) || null,
    faq: mapFaqItems(faqRaw, sanitize),
    testimonial: mapTestimonialItem(raw.featured_testimonial),
    ctaTitle: str(raw.cta_title) || null,
    ctaBody: str(raw.cta_body) || null,
    ctaLabel: str(raw.cta_label) || "Prendre rendez-vous",
    ctaSubtext: str(raw.cta_subtext) || null,
    seo: mapSeo(raw, settings, assetBase),
  };
}

/**
 * Charge et compose une offre par slug (Directus published, lecture seule).
 * `null` si aucune offre publiée ne porte ce slug.
 */
export async function loadOfferContent(slug: string): Promise<OfferContent | null> {
  const client = directusServer();
  const assetBase = useRuntimeConfig().public.directusPublicUrl;

  const [offer] = await client.request(
    readItems("offers", {
      filter: { status: { _eq: "published" }, slug: { _eq: slug } },
      limit: 1,
      fields: [
        "title",
        "slug",
        "audience",
        "duration_label",
        "price_label",
        "price_note",
        "accroche_title",
        "accroche_subtitle",
        "accroche_body",
        "accroche_signature",
        "outcomes_title",
        "outcomes_intro",
        "outcomes",
        "context_title",
        "context_items",
        "context_conclusion",
        "mission_title",
        "mission_includes",
        "format_body",
        "audience_fit_title",
        "audience_fit",
        "audience_fit_conclusion",
        // m2o testimonials : relation vers une vraie collection → sélection imbriquée OK.
        {
          featured_testimonial: [
            "quote",
            "author_name",
            "author_title",
            "company",
            "context",
            "audience",
          ],
        },
        "cta_title",
        "cta_body",
        "cta_label",
        "cta_subtext",
        "meta_title",
        "meta_description",
        // Champ fichier = ID brut (directus_files hors Schema typé, cf. shop.ts) → URL d'asset.
        "og_image",
        "no_index",
      ],
    }),
  );

  if (!offer) return null;

  const [faq, settings] = await Promise.all([
    client.request(
      readItems("faq_items", {
        filter: { status: { _eq: "published" }, scope: { _in: faqScopesForSlug(slug) } },
        sort: ["sort"],
        limit: -1,
        fields: ["question", "answer"],
      }),
    ),
    client.request(
      readSingleton("site_settings", {
        fields: ["brand_name", "default_meta_description", "default_og_image"],
      }),
    ),
  ]);

  return mapOfferContent(
    offer as unknown as RawOfferFull,
    faq,
    settings as unknown as RawSiteDefaults,
    assetBase,
    sanitizeRichText,
  );
}
