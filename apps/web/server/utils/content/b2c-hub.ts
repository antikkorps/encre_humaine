import { readItems, readSingleton } from "@directus/sdk";
import type { FaqItem, TestimonialItem } from "~/types/content";
import {
  type ContentPhoto,
  type ContentSeo,
  type FileField,
  mapFaqItems,
  mapPhoto,
  mapSeo,
  mapStringList,
  mapTestimonials,
  mapTitledItems,
  type RawSiteDefaults,
  safeHref,
  str,
  TESTIMONIAL_FIELDS,
  TESTIMONIAL_SORT,
  type TitledItem,
} from "./_shared";

/**
 * Contenu du hub Particuliers (B2C) — docs/04-particuliers-hub.md.
 * Source : `b2c_hub_page` + `faq_items` (scope=b2c_hub — périmètre PROPRE au hub
 * depuis le 2026-08-14, symétrique de `org` ; `b2c` est resté sur l'offre
 * Clarifier & avancer) + `testimonials` (b2c, M2O
 * unique `testimonial`) + `site_settings`. Ton empathique (9 sections, gabarit
 * riche calqué sur `offers`) : accroche, bénéfices, deux cartes situation
 * détaillées, façon d'accompagner, « pourquoi c'est différent », format, FAQ,
 * témoignage, CTA. **Deux champs rich text** (`how_i_work_body`,
 * `why_different_body`, + FAQ `answer`) assainis côté serveur via le sanitizer
 * injecté (docs/06 §1). Sections vides masquées.
 */

export interface RawB2cHub {
  accroche_title?: string | null;
  accroche_subtitle?: string | null;
  accroche_body?: string | null;
  accroche_signature?: string | null;
  accroche_cta_label?: string | null;
  accroche_photo?: FileField;
  outcomes_title?: string | null;
  outcomes_intro?: string | null;
  outcomes?: unknown; // répéteur { title, body }
  situations_title?: string | null;
  situations_intro?: string | null;
  situation_a_title?: string | null;
  situation_a_body?: string | null;
  situation_a_audience?: string | null;
  situation_a_items?: unknown; // répéteur { text }
  situation_a_result?: string | null;
  situation_a_cta_label?: string | null;
  situation_a_cta_link?: string | null;
  situation_b_title?: string | null;
  situation_b_body?: string | null;
  situation_b_audience?: string | null;
  situation_b_items?: unknown; // répéteur { text }
  situation_b_result?: string | null;
  situation_b_cta_label?: string | null;
  situation_b_cta_link?: string | null;
  how_i_work_title?: string | null;
  how_i_work_body?: string | null; // rich text
  how_i_work_signature?: string | null;
  why_different_title?: string | null;
  why_different_body?: string | null; // rich text
  format_title?: string | null;
  format_items?: unknown; // répéteur { text }
  format_body?: string | null;
  cta_title?: string | null;
  cta_body?: string | null;
  cta_label?: string | null;
  cta_subtext?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_image?: FileField;
  no_index?: boolean | null;
}

export interface B2cSituation {
  title: string;
  /** Chapô optionnel sous le titre de la carte. */
  body: string | null;
  /** « Pour qui ? ». */
  audience: string | null;
  /** « Ce que nous travaillons » (liste). */
  items: string[];
  /** « Résultat ». */
  result: string | null;
  ctaLabel: string | null;
  ctaLink: string;
}

export interface B2cHubContent {
  /** Source du `h1` (null = fallback d'affichage). */
  accrocheTitle: string | null;
  accrocheSubtitle: string | null;
  accrocheBody: string | null;
  accrocheSignature: string | null;
  /** CTA d'accroche (→ /contact) ; masqué si vide. */
  accrocheCtaLabel: string | null;
  /** Illustration d'accroche optionnelle (Directus) — masquée si absente. */
  accrochePhoto: ContentPhoto | null;
  /** « Ce que vous venez chercher » (bénéfices). */
  outcomesTitle: string | null;
  outcomesIntro: string | null;
  outcomes: TitledItem[];
  /** « Deux situations, deux accompagnements » (cartes détaillées). */
  situationsTitle: string | null;
  situationsIntro: string | null;
  situations: B2cSituation[];
  /** « Ma façon d'accompagner » — corps rich text assaini + encadré signature. */
  howIWorkTitle: string | null;
  howIWorkHtml: string | null;
  howIWorkSignature: string | null;
  /** « Pourquoi c'est différent » — corps rich text assaini (liste possible). */
  whyDifferentTitle: string | null;
  whyDifferentHtml: string | null;
  /** « Comment se déroule l'accompagnement » — puces format + texte. */
  formatTitle: string | null;
  formatItems: string[];
  formatBody: string | null;
  /** Témoignages centralisés (audience=particulier, vedettes d'abord) ; masqué si vide. */
  testimonials: TestimonialItem[];
  faq: FaqItem[];
  /** CTA final ; `ctaLabel` toujours présent (garde-fou d'affichage). */
  ctaTitle: string | null;
  ctaBody: string | null;
  ctaLabel: string;
  ctaSubtext: string | null;
  seo: ContentSeo;
}

type Sanitize = (html?: string | null) => string;

/**
 * Carte « situation » détaillée : masquée si entièrement vide. `ctaLink` retombe
 * sur l'offre cible.
 */
export function mapSituation(
  raw: {
    title?: unknown;
    body?: unknown;
    audience?: unknown;
    items?: unknown;
    result?: unknown;
    ctaLabel?: unknown;
    ctaLink?: unknown;
  },
  defaultLink: string,
): B2cSituation | null {
  const title = str(raw.title);
  const body = str(raw.body);
  const audience = str(raw.audience);
  const items = mapStringList(raw.items);
  const result = str(raw.result);
  if (!title && !body && !audience && !items.length && !result) return null;
  return {
    title,
    body: body || null,
    audience: audience || null,
    items,
    result: result || null,
    ctaLabel: str(raw.ctaLabel) || null,
    ctaLink: safeHref(raw.ctaLink) || defaultLink,
  };
}

/** Compose le payload du hub B2C (pur ; `sanitize` injecté pour le rich text). */
export function mapB2cHubContent(
  hub: RawB2cHub,
  faq: unknown,
  testimonialsRaw: unknown,
  settings: RawSiteDefaults,
  assetBase: string,
  sanitize: Sanitize,
): B2cHubContent {
  const situations = [
    mapSituation(
      {
        title: hub.situation_a_title,
        body: hub.situation_a_body,
        audience: hub.situation_a_audience,
        items: hub.situation_a_items,
        result: hub.situation_a_result,
        ctaLabel: hub.situation_a_cta_label,
        ctaLink: hub.situation_a_cta_link,
      },
      "/particuliers/clarifier-avancer",
    ),
    mapSituation(
      {
        title: hub.situation_b_title,
        body: hub.situation_b_body,
        audience: hub.situation_b_audience,
        items: hub.situation_b_items,
        result: hub.situation_b_result,
        ctaLabel: hub.situation_b_cta_label,
        ctaLink: hub.situation_b_cta_link,
      },
      "/particuliers/booster-recherche",
    ),
  ].filter((s): s is B2cSituation => s !== null);

  return {
    accrocheTitle: str(hub.accroche_title) || null,
    accrocheSubtitle: str(hub.accroche_subtitle) || null,
    accrocheBody: str(hub.accroche_body) || null,
    accrocheSignature: str(hub.accroche_signature) || null,
    accrocheCtaLabel: str(hub.accroche_cta_label) || null,
    accrochePhoto: mapPhoto(hub.accroche_photo, assetBase),
    outcomesTitle: str(hub.outcomes_title) || null,
    outcomesIntro: str(hub.outcomes_intro) || null,
    outcomes: mapTitledItems(hub.outcomes),
    situationsTitle: str(hub.situations_title) || null,
    situationsIntro: str(hub.situations_intro) || null,
    situations,
    howIWorkTitle: str(hub.how_i_work_title) || null,
    howIWorkHtml: sanitize(hub.how_i_work_body) || null,
    howIWorkSignature: str(hub.how_i_work_signature) || null,
    whyDifferentTitle: str(hub.why_different_title) || null,
    whyDifferentHtml: sanitize(hub.why_different_body) || null,
    formatTitle: str(hub.format_title) || null,
    formatItems: mapStringList(hub.format_items),
    formatBody: str(hub.format_body) || null,
    testimonials: mapTestimonials(testimonialsRaw),
    faq: mapFaqItems(faq, sanitize),
    ctaTitle: str(hub.cta_title) || null,
    ctaBody: str(hub.cta_body) || null,
    ctaLabel: str(hub.cta_label) || "Réserver une séance découverte gratuite",
    ctaSubtext: str(hub.cta_subtext) || null,
    seo: mapSeo(hub, settings, assetBase),
  };
}

/** Charge et compose le hub Particuliers (Directus published, lecture seule). */
export async function loadB2cHubContent(): Promise<B2cHubContent> {
  const client = directusServer();
  const assetBase = useRuntimeConfig().public.directusPublicUrl;

  const [hub, faq, testimonials, settings] = await Promise.all([
    client.request(
      readSingleton("b2c_hub_page", {
        fields: [
          "accroche_title",
          "accroche_subtitle",
          "accroche_body",
          "accroche_signature",
          "accroche_cta_label",
          "accroche_photo",
          "outcomes_title",
          "outcomes_intro",
          "outcomes",
          "situations_title",
          "situations_intro",
          "situation_a_title",
          "situation_a_body",
          "situation_a_audience",
          "situation_a_items",
          "situation_a_result",
          "situation_a_cta_label",
          "situation_a_cta_link",
          "situation_b_title",
          "situation_b_body",
          "situation_b_audience",
          "situation_b_items",
          "situation_b_result",
          "situation_b_cta_label",
          "situation_b_cta_link",
          "how_i_work_title",
          "how_i_work_body",
          "how_i_work_signature",
          "why_different_title",
          "why_different_body",
          "format_title",
          "format_items",
          "format_body",
          "cta_title",
          "cta_body",
          "cta_label",
          "cta_subtext",
          "meta_title",
          "meta_description",
          "og_image",
          "no_index",
        ],
      }),
    ),
    client.request(
      readItems("faq_items", {
        filter: { status: { _eq: "published" }, scope: { _eq: "b2c_hub" } },
        sort: ["sort"],
        limit: -1,
        fields: ["question", "answer"],
      }),
    ),
    client.request(
      readItems("testimonials", {
        filter: { status: { _eq: "published" }, audience: { _eq: "particulier" } },
        sort: [...TESTIMONIAL_SORT],
        limit: -1,
        fields: [...TESTIMONIAL_FIELDS],
      }),
    ),
    client.request(
      readSingleton("site_settings", {
        fields: ["brand_name", "default_meta_description", "default_og_image"],
      }),
    ),
  ]);

  return mapB2cHubContent(
    hub as unknown as RawB2cHub,
    faq,
    testimonials,
    settings as unknown as RawSiteDefaults,
    assetBase,
    sanitizeRichText,
  );
}
