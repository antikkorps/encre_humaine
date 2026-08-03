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
 * provient de Directus (critère d'acceptation). Les champs `input-rich-text-html`
 * (`accroche_body`, `story_body`, `why_body`, `octopus_body`) sont **assainis côté
 * serveur** au fetch (docs/06 §1) : le sanitizer est *injecté* dans le mapper pur
 * (testable sans la dépendance), `loadAboutContent` passe le vrai. Les sections
 * vides se masquent proprement (docs/00 §États).
 */

export interface RawAbout {
  accroche_title?: string | null;
  accroche_body?: string | null; // rich text
  story_title?: string | null;
  story_photo?: FileField;
  story_body?: string | null; // rich text
  story_photo_2?: FileField;
  story_body_2?: string | null; // rich text (2e bloc, optionnel)
  why_title?: string | null;
  why_body?: string | null; // rich text
  octopus_subtitle?: string | null;
  octopus_body?: string | null; // rich text
  convictions_title?: string | null;
  convictions?: unknown; // répéteur { title, body }
  work_title?: string | null;
  work_intro?: string | null;
  how_i_work?: unknown; // répéteur { title, body } (principes)
  location?: string | null;
  what_i_dont_do_title?: string | null;
  what_i_dont_do?: unknown; // répéteur { text }
  portrait_photo?: FileField;
  personal_quote?: string | null;
  cta_title?: string | null;
  cta_body?: string | null;
  cta_label?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_image?: FileField;
  no_index?: boolean | null;
}

/** Item « titre + corps » (convictions, principes de travail) — forme `TitledItem`. */
export type AboutConviction = TitledItem;

export interface AboutContent {
  /** Accroche : `title` = source du `h1` (fallback d'affichage côté page). */
  accroche: { title: string; bodyHtml: string } | null;
  /**
   * « Mon parcours » : bloc 1 (texte à gauche, photo à droite) + bloc 2 optionnel
   * (photo à gauche, texte à droite) pour aérer un texte long avec 2 visuels.
   */
  story: {
    title: string;
    photo: ContentPhoto | null;
    bodyHtml: string;
    photo2: ContentPhoto | null;
    bodyHtml2: string;
  } | null;
  why: { title: string; bodyHtml: string } | null;
  octopus: { subtitle: string; bodyHtml: string } | null;
  convictions: { title: string; items: AboutConviction[] } | null;
  work: {
    title: string;
    intro: string | null;
    principles: TitledItem[];
    location: string | null;
  } | null;
  whatIDontDo: { title: string; items: string[] } | null;
  portrait: { photo: ContentPhoto | null; quote: string | null } | null;
  /** Toujours présent (section de conversion) ; `label` = garde-fou d'affichage. */
  cta: { title: string; body: string | null; label: string };
  seo: ContentSeo;
}

/** Sous-champs demandés pour une photo expansée (dimensions natives + alt). */
const PHOTO_FIELDS = ["id", "width", "height", "title", "description"] as const;

/** Signature du sanitizer injecté (cf. `sanitizeRichText`). */
type Sanitize = (html?: string | null) => string;

/** Items « titre + corps » avec au moins un des deux (convictions, docs/02 §5). */
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
  const accrocheTitle = str(raw.accroche_title);
  const accrocheHtml = sanitize(raw.accroche_body);
  const storyTitle = str(raw.story_title);
  const storyHtml = sanitize(raw.story_body);
  const storyPhoto = mapPhoto(raw.story_photo, assetBase);
  const storyHtml2 = sanitize(raw.story_body_2);
  const storyPhoto2 = mapPhoto(raw.story_photo_2, assetBase);
  const whyTitle = str(raw.why_title);
  const whyHtml = sanitize(raw.why_body);
  const octoSubtitle = str(raw.octopus_subtitle);
  const octoHtml = sanitize(raw.octopus_body);
  const convictions = mapConvictions(raw.convictions);
  const principles = mapTitledItems(raw.how_i_work);
  const workTitle = str(raw.work_title);
  const workIntro = str(raw.work_intro);
  const location = str(raw.location);
  const dontItems = mapStringList(raw.what_i_dont_do);
  const portraitPhoto = mapPhoto(raw.portrait_photo, assetBase);
  const quote = str(raw.personal_quote) || null;

  return {
    accroche:
      accrocheTitle || accrocheHtml ? { title: accrocheTitle, bodyHtml: accrocheHtml } : null,
    story:
      storyTitle || storyHtml || storyPhoto || storyHtml2 || storyPhoto2
        ? {
            title: storyTitle,
            photo: storyPhoto,
            bodyHtml: storyHtml,
            photo2: storyPhoto2,
            bodyHtml2: storyHtml2,
          }
        : null,
    why: whyTitle || whyHtml ? { title: whyTitle, bodyHtml: whyHtml } : null,
    octopus: octoSubtitle || octoHtml ? { subtitle: octoSubtitle, bodyHtml: octoHtml } : null,
    convictions: convictions.length
      ? { title: str(raw.convictions_title), items: convictions }
      : null,
    work:
      workTitle || workIntro || principles.length || location
        ? { title: workTitle, intro: workIntro || null, principles, location: location || null }
        : null,
    whatIDontDo: dontItems.length
      ? { title: str(raw.what_i_dont_do_title), items: dontItems }
      : null,
    portrait: portraitPhoto || quote ? { photo: portraitPhoto, quote } : null,
    cta: {
      title: str(raw.cta_title),
      body: str(raw.cta_body) || null,
      label: str(raw.cta_label) || "Travaillons ensemble",
    },
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
          "accroche_title",
          "accroche_body",
          "story_title",
          // Champs fichier = ID brut (directus_files hors Schema typé) → URL d'asset.
          // EXCEPTION, les photos du parcours : champ **expansé** (dimensions +
          // alt) — les dimensions natives permettent d'afficher le portrait
          // ENTIER (sans rognage) tout en réservant la place (zéro CLS).
          { story_photo: PHOTO_FIELDS },
          "story_body",
          { story_photo_2: PHOTO_FIELDS },
          "story_body_2",
          "why_title",
          "why_body",
          "octopus_subtitle",
          "octopus_body",
          "convictions_title",
          "convictions",
          "work_title",
          "work_intro",
          "how_i_work",
          "location",
          "what_i_dont_do_title",
          "what_i_dont_do",
          "portrait_photo",
          "personal_quote",
          "cta_title",
          "cta_body",
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
