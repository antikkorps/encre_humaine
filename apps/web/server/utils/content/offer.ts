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
  accroche_body?: string | null;
  mission_includes?: unknown; // répéteur { text }
  outcomes?: unknown; // répéteur { title, body }
  audience_fit?: unknown; // répéteur { text }
  format_body?: string | null; // rich text
  featured_testimonial?: unknown; // m2o testimonials (résolu) ou string
  cta_label?: string | null;
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
  accrocheBody: string | null;
  /** « Ce que comprend la mission / Ce qu'on fait ensemble ». */
  missionIncludes: string[];
  /** « Comment ça se passe » (B2B) / « Le format » (B2C) — assaini ; "" si vide. */
  formatBodyHtml: string;
  /** « Ce que vous en retirez / repartez avec ». */
  outcomes: TitledItem[];
  /** « Pour qui (et pas pour qui) ». */
  audienceFit: string[];
  durationLabel: string | null;
  /** « Investissement » — libellé libre, jamais un montant calculé. */
  priceLabel: string | null;
  priceNote: string | null;
  faq: FaqItem[];
  testimonial: TestimonialItem | null;
  /** Toujours présent (conversion) ; fallback = garde-fou d'affichage. */
  ctaLabel: string;
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
  return {
    audience: asAudience(raw.audience) ?? null,
    accrocheTitle: str(raw.accroche_title) || null,
    accrocheBody: str(raw.accroche_body) || null,
    missionIncludes: mapStringList(raw.mission_includes),
    formatBodyHtml: sanitize(raw.format_body),
    outcomes: mapTitledItems(raw.outcomes),
    audienceFit: mapStringList(raw.audience_fit),
    durationLabel: str(raw.duration_label) || null,
    priceLabel: str(raw.price_label) || null,
    priceNote: str(raw.price_note) || null,
    faq: mapFaqItems(faqRaw, sanitize),
    testimonial: mapTestimonialItem(raw.featured_testimonial),
    ctaLabel: str(raw.cta_label) || "Prendre rendez-vous",
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
        "accroche_body",
        "mission_includes",
        "outcomes",
        "audience_fit",
        "format_body",
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
        "cta_label",
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
