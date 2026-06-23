import { readItems, readSingleton } from "@directus/sdk";
import type { FaqItem, TestimonialItem } from "~/types/content";
import {
  type ContentPhoto,
  type ContentSeo,
  type FileField,
  mapFaqItems,
  mapPhoto,
  mapSeo,
  mapTestimonialItem,
  type RawSiteDefaults,
  str,
} from "./_shared";

/**
 * Contenu du hub Particuliers (B2C) — docs/04-particuliers-hub.md.
 * Source : `b2c_hub_page` + `faq_items` (scope=b2c) + `testimonials` (b2c, M2O
 * unique `testimonial`) + `site_settings`. Ton plus empathique que le B2B :
 * deux blocs « situation » qui orientent vers les offres B2C, pas de cartes.
 * **Deux champs rich text** (`how_i_work_body`, FAQ `answer`) assainis côté
 * serveur via le sanitizer injecté (docs/06 §1). Sections vides masquées.
 */

export interface RawB2cHub {
  accroche_title?: string | null;
  accroche_body?: string | null;
  accroche_photo?: FileField;
  situation_a_title?: string | null;
  situation_a_body?: string | null;
  situation_a_cta_label?: string | null;
  situation_a_cta_link?: string | null;
  situation_b_title?: string | null;
  situation_b_body?: string | null;
  situation_b_cta_label?: string | null;
  situation_b_cta_link?: string | null;
  how_i_work_body?: string | null; // rich text
  testimonial?: unknown; // M2O testimonials (objet résolu ou string)
  cta_label?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_image?: FileField;
  no_index?: boolean | null;
}

export interface B2cSituation {
  title: string;
  body: string | null;
  ctaLabel: string | null;
  ctaLink: string;
}

export interface B2cHubContent {
  /** Source du `h1` (null = fallback d'affichage). */
  accrocheTitle: string | null;
  accrocheBody: string | null;
  /** Illustration d'accroche optionnelle (Directus) — masquée si absente. */
  accrochePhoto: ContentPhoto | null;
  situations: B2cSituation[];
  howIWorkHtml: string | null;
  testimonial: TestimonialItem | null;
  faq: FaqItem[];
  /** Toujours présent (conversion) ; fallback = garde-fou d'affichage. */
  ctaLabel: string;
  seo: ContentSeo;
}

type Sanitize = (html?: string | null) => string;

/** Bloc « situation » : masqué si ni titre ni corps. `ctaLink` retombe sur l'offre cible. */
export function mapSituation(
  title: unknown,
  body: unknown,
  ctaLabel: unknown,
  ctaLink: unknown,
  defaultLink: string,
): B2cSituation | null {
  const t = str(title);
  const b = str(body);
  if (!t && !b) return null;
  return {
    title: t,
    body: b || null,
    ctaLabel: str(ctaLabel) || null,
    ctaLink: str(ctaLink) || defaultLink,
  };
}

/** Compose le payload du hub B2C (pur ; `sanitize` injecté pour le rich text). */
export function mapB2cHubContent(
  hub: RawB2cHub,
  faq: unknown,
  settings: RawSiteDefaults,
  assetBase: string,
  sanitize: Sanitize,
): B2cHubContent {
  const situations = [
    mapSituation(
      hub.situation_a_title,
      hub.situation_a_body,
      hub.situation_a_cta_label,
      hub.situation_a_cta_link,
      "/particuliers/clarifier-avancer",
    ),
    mapSituation(
      hub.situation_b_title,
      hub.situation_b_body,
      hub.situation_b_cta_label,
      hub.situation_b_cta_link,
      "/particuliers/booster-recherche",
    ),
  ].filter((s): s is B2cSituation => s !== null);

  return {
    accrocheTitle: str(hub.accroche_title) || null,
    accrocheBody: str(hub.accroche_body) || null,
    accrochePhoto: mapPhoto(hub.accroche_photo, assetBase),
    situations,
    howIWorkHtml: sanitize(hub.how_i_work_body) || null,
    testimonial: mapTestimonialItem(hub.testimonial),
    faq: mapFaqItems(faq, sanitize),
    ctaLabel: str(hub.cta_label) || "Réserver une séance découverte gratuite",
    seo: mapSeo(hub, settings, assetBase),
  };
}

/** Charge et compose le hub Particuliers (Directus published, lecture seule). */
export async function loadB2cHubContent(): Promise<B2cHubContent> {
  const client = directusServer();
  const assetBase = useRuntimeConfig().public.directusPublicUrl;

  const [hub, faq, settings] = await Promise.all([
    client.request(
      readSingleton("b2c_hub_page", {
        fields: [
          "accroche_title",
          "accroche_body",
          "accroche_photo",
          "situation_a_title",
          "situation_a_body",
          "situation_a_cta_label",
          "situation_a_cta_link",
          "situation_b_title",
          "situation_b_body",
          "situation_b_cta_label",
          "situation_b_cta_link",
          "how_i_work_body",
          {
            testimonial: ["quote", "author_name", "author_title", "company", "context", "audience"],
          },
          "cta_label",
          "meta_title",
          "meta_description",
          "og_image",
          "no_index",
        ],
      }),
    ),
    client.request(
      readItems("faq_items", {
        filter: { status: { _eq: "published" }, scope: { _eq: "b2c" } },
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

  return mapB2cHubContent(
    hub as unknown as RawB2cHub,
    faq,
    settings as unknown as RawSiteDefaults,
    assetBase,
    sanitizeRichText,
  );
}
