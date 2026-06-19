import { readSingleton } from "@directus/sdk";
import {
  type ContentSeo,
  type FileField,
  mapSeo,
  mapStringList,
  type RawSiteDefaults,
  str,
} from "./_shared";

/**
 * Contenu de la page Newsletter « Le Fil » — docs/08-newsletter.md. Source :
 * `newsletter_page` (singleton) + `site_settings` (défauts SEO). `promise_body`
 * est du rich text → **assaini serveur** (sanitizer injecté). L'inscription elle-
 * même passe par `NewsletterForm` → `POST /api/newsletter/subscribe` (double
 * opt-in). Sections vides masquées (docs/00 §États).
 *
 * NB : à ne pas confondre avec `server/utils/newsletter.ts` (crypto token + purge
 * RGPD) ; ici c'est uniquement le **contenu éditorial** de la page.
 */

/** M2O `welcome_gift_label` → resources (résolu) ou id brut (string). */
interface RawGift {
  title?: string | null;
  slug?: string | null;
}

export interface RawNewsletterPage {
  name?: string | null;
  promise_body?: string | null; // rich text
  what_you_receive?: unknown; // répéteur { text }
  welcome_gift_label?: RawGift | string | null; // m2o resources
  sample_excerpt?: string | null;
  sample_issue_label?: string | null;
  rgpd_mention?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_image?: FileField;
  no_index?: boolean | null;
}

export interface NewsletterContent {
  /** Source du `h1` (null = fallback d'affichage). */
  name: string | null;
  promiseHtml: string;
  whatYouReceive: string[];
  /** Libellé du cadeau de bienvenue (titre de la ressource liée), si défini. */
  welcomeGiftLabel: string | null;
  /** Aperçu d'un numéro ; `null` si pas d'extrait. */
  sample: { excerpt: string; issueLabel: string | null } | null;
  rgpdMention: string | null;
  seo: ContentSeo;
}

/** Signature du sanitizer injecté (cf. `sanitizeRichText`). */
type Sanitize = (html?: string | null) => string;

/** Titre du cadeau (m2o résolu) ; `null` si non défini ou relation non résolue. */
function giftLabel(raw: RawNewsletterPage["welcome_gift_label"]): string | null {
  if (!raw || typeof raw !== "object") return null;
  return str(raw.title) || null;
}

/** Compose le payload de la page (pur ; `sanitize` injecté pour le rich text). */
export function mapNewsletterContent(
  raw: RawNewsletterPage,
  settings: RawSiteDefaults,
  assetBase: string,
  sanitize: Sanitize,
): NewsletterContent {
  const excerpt = str(raw.sample_excerpt);
  return {
    name: str(raw.name) || null,
    promiseHtml: sanitize(raw.promise_body),
    whatYouReceive: mapStringList(raw.what_you_receive),
    welcomeGiftLabel: giftLabel(raw.welcome_gift_label),
    sample: excerpt ? { excerpt, issueLabel: str(raw.sample_issue_label) || null } : null,
    rgpdMention: str(raw.rgpd_mention) || null,
    seo: mapSeo(raw, settings, assetBase),
  };
}

/** Charge et compose la page Newsletter (Directus published, lecture seule). */
export async function loadNewsletterContent(): Promise<NewsletterContent> {
  const client = directusServer();
  const assetBase = useRuntimeConfig().public.directusPublicUrl;

  const [page, settings] = await Promise.all([
    client.request(
      readSingleton("newsletter_page", {
        fields: [
          "name",
          "promise_body",
          "what_you_receive",
          // m2o vers une vraie collection → sélection imbriquée OK.
          { welcome_gift_label: ["title", "slug"] },
          "sample_excerpt",
          "sample_issue_label",
          "rgpd_mention",
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

  return mapNewsletterContent(
    page as unknown as RawNewsletterPage,
    settings as unknown as RawSiteDefaults,
    assetBase,
    sanitizeRichText,
  );
}
