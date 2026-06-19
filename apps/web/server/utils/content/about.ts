import { readSingleton } from "@directus/sdk";
import {
  type ContentPhoto,
  type ContentSeo,
  type FileField,
  mapPhoto,
  mapSeo,
  mapStringList,
  mapTitledItems,
  type RawSiteDefaults,
  str,
  type TitledItem,
} from "./_shared";

/**
 * Contenu de la page « À propos » — docs/02-a-propos.md, docs/02-content-model.md §4.
 * Source : `about_page` (singleton) + `site_settings` (défauts SEO). Tout le contenu
 * provient de Directus (critère d'acceptation). Les 4 champs `input-rich-text-html`
 * (`story_body`, `why_body`, `octopus_body`, `what_i_dont_do`) sont **assainis côté
 * serveur** au fetch (docs/06 §1, contrat `RichText`) : le sanitizer est *injecté*
 * dans le mapper pur (testable sans la dépendance), `loadAboutContent` passe le vrai.
 * Les sections vides se masquent proprement (docs/00 §États).
 */

export interface RawAbout {
  accroche?: string | null;
  story_photo?: FileField;
  story_body?: string | null; // rich text
  why_title?: string | null;
  why_body?: string | null; // rich text
  octopus_body?: string | null; // rich text
  convictions?: unknown; // répéteur { title, body }
  how_i_work?: unknown; // répéteur { text }
  what_i_dont_do?: string | null; // rich text
  portrait_photo?: FileField;
  personal_quote?: string | null;
  cta_label?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_image?: FileField;
  no_index?: boolean | null;
}

/** « Ce en quoi je crois » : item titre + corps (forme commune `TitledItem`). */
export type AboutConviction = TitledItem;

export interface AboutContent {
  /** Source du `h1` (null = fallback d'affichage côté page). */
  accroche: string | null;
  story: { photo: ContentPhoto | null; bodyHtml: string } | null;
  why: { title: string; bodyHtml: string } | null;
  octopusHtml: string | null;
  convictions: AboutConviction[];
  howIWork: string[];
  whatIDontDoHtml: string | null;
  portrait: { photo: ContentPhoto | null; quote: string | null } | null;
  /** Toujours présent (section de conversion) ; fallback = garde-fous d'affichage. */
  ctaLabel: string;
  seo: ContentSeo;
}

/** Signature du sanitizer injecté (cf. `sanitizeRichText`). */
type Sanitize = (html?: string | null) => string;

/** « Ce en quoi je crois » : items avec au moins un titre ou un corps (docs/02 §5). */
export function mapConvictions(raw: unknown): AboutConviction[] {
  return mapTitledItems(raw);
}

/** Compose le payload de la page (pur ; `sanitize` injecté pour le rich text). */
export function mapAboutContent(
  raw: RawAbout,
  settings: RawSiteDefaults,
  assetBase: string,
  sanitize: Sanitize,
): AboutContent {
  const storyHtml = sanitize(raw.story_body);
  const storyPhoto = mapPhoto(raw.story_photo, assetBase);
  const whyTitle = str(raw.why_title);
  const whyHtml = sanitize(raw.why_body);
  const portraitPhoto = mapPhoto(raw.portrait_photo, assetBase);
  const quote = str(raw.personal_quote) || null;

  return {
    accroche: str(raw.accroche) || null,
    story: storyHtml || storyPhoto ? { photo: storyPhoto, bodyHtml: storyHtml } : null,
    why: whyTitle || whyHtml ? { title: whyTitle, bodyHtml: whyHtml } : null,
    octopusHtml: sanitize(raw.octopus_body) || null,
    convictions: mapConvictions(raw.convictions),
    howIWork: mapStringList(raw.how_i_work),
    whatIDontDoHtml: sanitize(raw.what_i_dont_do) || null,
    portrait: portraitPhoto || quote ? { photo: portraitPhoto, quote } : null,
    ctaLabel: str(raw.cta_label) || "Travaillons ensemble",
    seo: mapSeo(raw, settings, assetBase),
  };
}

/** Charge et compose le contenu « À propos » (Directus published, lecture seule). */
export async function loadAboutContent(): Promise<AboutContent> {
  const client = directusServer();
  const assetBase = useRuntimeConfig().public.directusPublicUrl;

  const [about, settings] = await Promise.all([
    client.request(
      readSingleton("about_page", {
        fields: [
          "accroche",
          // Champs fichier = ID brut (directus_files hors Schema typé) → URL d'asset.
          "story_photo",
          "story_body",
          "why_title",
          "why_body",
          "octopus_body",
          "convictions",
          "how_i_work",
          "what_i_dont_do",
          "portrait_photo",
          "personal_quote",
          "cta_label",
          "meta_title",
          "meta_description",
          "og_image",
          "no_index",
        ],
      }),
    ),
    client.request(
      readSingleton("site_settings", {
        fields: ["brand_name", "default_meta_description", "default_og_image"],
      }),
    ),
  ]);

  return mapAboutContent(
    about as unknown as RawAbout,
    settings as unknown as RawSiteDefaults,
    assetBase,
    sanitizeRichText,
  );
}
