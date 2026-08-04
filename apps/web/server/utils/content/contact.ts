import { readItems, readSingleton } from "@directus/sdk";
import type { FaqItem } from "~/types/content";
import {
  type ContentSeo,
  type FileField,
  mapFaqItems,
  mapNumberedSteps,
  mapSeo,
  mapStringList,
  type NumberedStep,
  type RawSiteDefaults,
  safeHref,
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
  accroche_subtitle?: string | null;
  accroche_body?: string | null;
  contact_intro?: string | null;
  booking_intro?: string | null;
  booking_reassurance?: string | null;
  message_intro?: string | null;
  steps_title?: string | null;
  next_steps?: unknown; // répéteur number/title/description
  steps_conclusion?: string | null;
  response_time_note?: string | null;
  reasons_title?: string | null;
  reasons_org_lead?: string | null;
  reasons_org?: unknown; // répéteur { text }
  reasons_b2c_lead?: string | null;
  reasons_b2c?: unknown; // répéteur { text }
  final_cta_title?: string | null;
  final_cta_body?: string | null;
  final_cta_subtext?: string | null;
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
  accrocheSubtitle: string | null;
  accrocheBody: string | null;
  /** Introduction de la section « Premier contact ». */
  contactIntro: string | null;
  /** Prise de RDV : `null` si aucune URL configurée (section masquée). */
  booking: { url: string; intro: string | null; reassurance: string | null } | null;
  /** Texte au-dessus du formulaire message. */
  messageIntro: string | null;
  stepsTitle: string | null;
  nextSteps: NumberedStep[];
  stepsConclusion: string | null;
  responseTimeNote: string | null;
  /** « Vous pouvez me contacter si… » (org + particuliers) ; `null` si vide. */
  reasons: {
    title: string | null;
    orgLead: string | null;
    org: string[];
    b2cLead: string | null;
    b2c: string[];
  } | null;
  faq: FaqItem[];
  /** CTA final ; `null` si ni titre ni corps. */
  finalCta: { title: string | null; body: string | null; subtext: string | null } | null;
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
  const bookingUrl = safeHref(settings.booking_url);
  const reasonsTitle = str(page.reasons_title);
  const reasonsOrg = mapStringList(page.reasons_org);
  const reasonsB2c = mapStringList(page.reasons_b2c);
  const finalCtaTitle = str(page.final_cta_title);
  const finalCtaBody = str(page.final_cta_body);
  return {
    accrocheTitle: str(page.accroche_title) || null,
    accrocheSubtitle: str(page.accroche_subtitle) || null,
    accrocheBody: str(page.accroche_body) || null,
    contactIntro: str(page.contact_intro) || null,
    booking: bookingUrl
      ? {
          url: bookingUrl,
          intro: str(page.booking_intro) || null,
          reassurance: str(page.booking_reassurance) || null,
        }
      : null,
    messageIntro: str(page.message_intro) || null,
    stepsTitle: str(page.steps_title) || null,
    nextSteps: mapNumberedSteps(page.next_steps),
    stepsConclusion: str(page.steps_conclusion) || null,
    responseTimeNote: str(page.response_time_note) || null,
    reasons:
      reasonsTitle || reasonsOrg.length || reasonsB2c.length
        ? {
            title: reasonsTitle || null,
            orgLead: str(page.reasons_org_lead) || null,
            org: reasonsOrg,
            b2cLead: str(page.reasons_b2c_lead) || null,
            b2c: reasonsB2c,
          }
        : null,
    faq: mapFaqItems(faqRaw, sanitize),
    finalCta:
      finalCtaTitle || finalCtaBody
        ? {
            title: finalCtaTitle || null,
            body: finalCtaBody || null,
            subtext: str(page.final_cta_subtext) || null,
          }
        : null,
    contact: {
      email: str(settings.contact_email) || null,
      linkedin: safeHref(settings.linkedin_url) || null,
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
          "accroche_subtitle",
          "accroche_body",
          "contact_intro",
          "booking_intro",
          "booking_reassurance",
          "message_intro",
          "steps_title",
          "next_steps",
          "steps_conclusion",
          "response_time_note",
          "reasons_title",
          "reasons_org_lead",
          "reasons_org",
          "reasons_b2c_lead",
          "reasons_b2c",
          "final_cta_title",
          "final_cta_body",
          "final_cta_subtext",
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
