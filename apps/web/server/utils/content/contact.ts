import { readItems, readSingleton } from "@directus/sdk";
import type { FaqItem } from "~/types/content";
import {
  type ContentSeo,
  type FileField,
  mapFaqItems,
  mapNumberedSteps,
  mapSeo,
  type NumberedStep,
  type RawSiteDefaults,
  str,
} from "./_shared";

/**
 * Contenu de la page Contact — docs/09-contact.md. Source : `contact_page` +
 * `faq_items` (scope=contact) + `site_settings`. La prise de RDV est servie par
 * `BookingEmbed` (provider Cal.com isolé) à partir de `site_settings.booking_url`
 * — nom agnostique du provider (cf. principe). FAQ rich text **assainie serveur**
 * (sanitizer injecté). Sections vides masquées (docs/00 §États).
 */

export interface RawContactPage {
  accroche_title?: string | null;
  accroche_body?: string | null;
  booking_intro?: string | null;
  next_steps?: unknown; // répéteur number/title/description
  response_time_note?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_image?: FileField;
  no_index?: boolean | null;
}

/** Champs `site_settings` consommés ici (SEO + coordonnées + URL de RDV). */
export interface RawContactSettings extends RawSiteDefaults {
  contact_email?: string | null;
  linkedin_url?: string | null;
  location_label?: string | null;
  booking_url?: string | null;
}

export interface ContactContent {
  /** Source du `h1` (null = fallback d'affichage). */
  accrocheTitle: string | null;
  accrocheBody: string | null;
  /** Prise de RDV : `null` si aucune URL configurée (section masquée). */
  booking: { url: string; intro: string | null } | null;
  nextSteps: NumberedStep[];
  responseTimeNote: string | null;
  faq: FaqItem[];
  contact: { email: string | null; linkedin: string | null; location: string | null };
  seo: ContentSeo;
}

/** Signature du sanitizer injecté (cf. `sanitizeRichText`). */
type Sanitize = (html?: string | null) => string;

/** Compose le payload de la page (pur ; `sanitize` injecté pour la FAQ rich text). */
export function mapContactContent(
  page: RawContactPage,
  faqRaw: unknown,
  settings: RawContactSettings,
  assetBase: string,
  sanitize: Sanitize,
): ContactContent {
  const bookingUrl = str(settings.booking_url);
  return {
    accrocheTitle: str(page.accroche_title) || null,
    accrocheBody: str(page.accroche_body) || null,
    booking: bookingUrl ? { url: bookingUrl, intro: str(page.booking_intro) || null } : null,
    nextSteps: mapNumberedSteps(page.next_steps),
    responseTimeNote: str(page.response_time_note) || null,
    faq: mapFaqItems(faqRaw, sanitize),
    contact: {
      email: str(settings.contact_email) || null,
      linkedin: str(settings.linkedin_url) || null,
      location: str(settings.location_label) || null,
    },
    seo: mapSeo(page, settings, assetBase),
  };
}

/** Charge et compose la page Contact (Directus published, lecture seule). */
export async function loadContactContent(): Promise<ContactContent> {
  const client = directusServer();
  const assetBase = useRuntimeConfig().public.directusPublicUrl;

  const [page, faq, settings] = await Promise.all([
    client.request(
      readSingleton("contact_page", {
        fields: [
          "accroche_title",
          "accroche_body",
          "booking_intro",
          "next_steps",
          "response_time_note",
          "meta_title",
          "meta_description",
          "og_image",
          "no_index",
        ],
      }),
    ),
    client.request(
      readItems("faq_items", {
        filter: { status: { _eq: "published" }, scope: { _eq: "contact" } },
        sort: ["sort"],
        limit: -1,
        fields: ["question", "answer"],
      }),
    ),
    client.request(
      readSingleton("site_settings", {
        fields: [
          "brand_name",
          "default_meta_description",
          "default_og_image",
          "contact_email",
          "linkedin_url",
          "location_label",
          "booking_url",
        ],
      }),
    ),
  ]);

  return mapContactContent(
    page as unknown as RawContactPage,
    faq,
    settings as unknown as RawContactSettings,
    assetBase,
    sanitizeRichText,
  );
}
