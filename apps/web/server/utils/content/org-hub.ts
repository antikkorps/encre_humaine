import { readItems, readSingleton } from "@directus/sdk";
import type { OfferSummary, TestimonialItem } from "~/types/content";
import {
  type ContentPhoto,
  type ContentSeo,
  type FileField,
  mapNumberedSteps,
  mapOffers,
  mapPhoto,
  mapSeo,
  mapStringList,
  mapTestimonials,
  mapTitledItems,
  type NumberedStep,
  type RawSiteDefaults,
  str,
  type TitledItem,
} from "./_shared";

/**
 * Contenu du hub Organisations (B2B) — docs/03-organisations-hub.md.
 * Source : `org_hub_page` + `offers` (audience=organisation) + `testimonials`
 * (b2b) + `site_settings`. **La page oriente, elle ne détaille pas** : on ne lit
 * que le résumé des offres (titre/slug/phrase/durée/tarif), le lien mène au
 * gabarit `/organisations/[slug]`. Cartes offres **dynamiques** : ajouter une
 * offre en back-office → carte sans dev. Le seul champ rich text (`differentiator_body`)
 * est **assaini côté serveur** au fetch (docs/06 §1) via le `sanitize` injecté.
 * Témoignages masqués si vides (docs/00 §États). Mappers communs dans `_shared`.
 */

export interface RawOrgHub {
  accroche_title?: string | null;
  accroche_subtitle?: string | null;
  accroche_body?: string | null;
  accroche_signature?: string | null;
  accroche_photo?: FileField;
  observe_title?: string | null;
  observe_intro?: string | null;
  observe_items?: unknown; // répéteur { title, body }
  observe_conclusion?: string | null;
  offers_title?: string | null;
  method_title?: string | null;
  method_intro?: string | null;
  method_steps?: unknown; // répéteur number + title + description
  differentiator_title?: string | null;
  differentiator_body?: string | null; // rich text
  audience_title?: string | null;
  audience_items?: unknown; // répéteur text
  audience_conclusion?: string | null;
  testimonials_title?: string | null;
  cta_title?: string | null;
  cta_body?: string | null;
  cta_label?: string | null;
  cta_subtext?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_image?: FileField;
  no_index?: boolean | null;
}

export interface OrgHubContent {
  /** Source du `h1` (null = fallback d'affichage). */
  accrocheTitle: string | null;
  accrocheSubtitle: string | null;
  accrocheBody: string | null;
  accrocheSignature: string | null;
  /** Illustration d'accroche optionnelle (Directus) — masquée si absente. */
  accrochePhoto: ContentPhoto | null;
  observe: {
    title: string;
    intro: string | null;
    items: TitledItem[];
    conclusion: string | null;
  } | null;
  /** Titre de la section offres (cartes dynamiques). */
  offersTitle: string;
  offers: OfferSummary[];
  method: { title: string; intro: string | null; steps: NumberedStep[] } | null;
  differentiator: { title: string; bodyHtml: string } | null;
  audience: { title: string; items: string[]; conclusion: string | null } | null;
  testimonialsTitle: string;
  testimonials: TestimonialItem[];
  /** Toujours présent (conversion) ; fallbacks = garde-fous d'affichage. */
  cta: { title: string; body: string | null; label: string; subtext: string | null };
  seo: ContentSeo;
}

/** Signature du sanitizer injecté (cf. `sanitizeRichText`). */
type Sanitize = (html?: string | null) => string;

/** Compose le payload du hub (pur ; `sanitize` injecté pour le rich text). */
export function mapOrgHubContent(
  hub: RawOrgHub,
  offers: unknown,
  testimonials: unknown,
  settings: RawSiteDefaults,
  assetBase: string,
  sanitize: Sanitize,
): OrgHubContent {
  const observeItems = mapTitledItems(hub.observe_items);
  const observeTitle = str(hub.observe_title);
  const observeIntro = str(hub.observe_intro);
  const observeConclusion = str(hub.observe_conclusion);
  const steps = mapNumberedSteps(hub.method_steps);
  const methodTitle = str(hub.method_title);
  const methodIntro = str(hub.method_intro);
  const diffTitle = str(hub.differentiator_title);
  const diffHtml = sanitize(hub.differentiator_body);
  const audienceItems = mapStringList(hub.audience_items);
  const audienceTitle = str(hub.audience_title);
  const audienceConclusion = str(hub.audience_conclusion);

  return {
    accrocheTitle: str(hub.accroche_title) || null,
    accrocheSubtitle: str(hub.accroche_subtitle) || null,
    accrocheBody: str(hub.accroche_body) || null,
    accrocheSignature: str(hub.accroche_signature) || null,
    accrochePhoto: mapPhoto(hub.accroche_photo, assetBase),
    observe:
      observeTitle || observeIntro || observeItems.length || observeConclusion
        ? {
            title: observeTitle,
            intro: observeIntro || null,
            items: observeItems,
            conclusion: observeConclusion || null,
          }
        : null,
    offersTitle: str(hub.offers_title) || "Mes offres pour les organisations",
    offers: mapOffers(offers, "organisation"),
    method:
      methodTitle || methodIntro || steps.length
        ? { title: methodTitle, intro: methodIntro || null, steps }
        : null,
    differentiator: diffTitle || diffHtml ? { title: diffTitle, bodyHtml: diffHtml } : null,
    audience:
      audienceTitle || audienceItems.length || audienceConclusion
        ? { title: audienceTitle, items: audienceItems, conclusion: audienceConclusion || null }
        : null,
    testimonialsTitle: str(hub.testimonials_title) || "Ils m'ont fait confiance",
    testimonials: mapTestimonials(testimonials),
    cta: {
      title: str(hub.cta_title) || "Travaillons ensemble",
      body: str(hub.cta_body) || null,
      label: str(hub.cta_label) || "Prendre rendez-vous",
      subtext: str(hub.cta_subtext) || null,
    },
    seo: mapSeo(hub, settings, assetBase),
  };
}

/** Charge et compose le hub Organisations (Directus published, lecture seule). */
export async function loadOrgHubContent(): Promise<OrgHubContent> {
  const client = directusServer();
  const assetBase = useRuntimeConfig().public.directusPublicUrl;

  const [hub, offers, testimonials, settings] = await Promise.all([
    client.request(
      readSingleton("org_hub_page", {
        fields: [
          "accroche_title",
          "accroche_subtitle",
          "accroche_body",
          "accroche_signature",
          "accroche_photo",
          "observe_title",
          "observe_intro",
          "observe_items",
          "observe_conclusion",
          "offers_title",
          "method_title",
          "method_intro",
          "method_steps",
          "differentiator_title",
          "differentiator_body",
          "audience_title",
          "audience_items",
          "audience_conclusion",
          "testimonials_title",
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
      readItems("offers", {
        filter: { status: { _eq: "published" }, audience: { _eq: "organisation" } },
        sort: ["sort"],
        limit: -1,
        fields: [
          "title",
          "slug",
          "audience",
          "icon",
          "short_description",
          "duration_label",
          "price_label",
        ],
      }),
    ),
    client.request(
      readItems("testimonials", {
        filter: { status: { _eq: "published" }, audience: { _eq: "organisation" } },
        sort: ["sort"],
        limit: -1,
        fields: ["quote", "author_name", "author_title", "company", "context", "audience"],
      }),
    ),
    client.request(
      readSingleton("site_settings", {
        fields: ["brand_name", "default_meta_description", "default_og_image"],
      }),
    ),
  ]);

  return mapOrgHubContent(
    hub as unknown as RawOrgHub,
    offers,
    testimonials,
    settings as unknown as RawSiteDefaults,
    assetBase,
    sanitizeRichText,
  );
}
