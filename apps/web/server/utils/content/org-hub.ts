import { readItems, readSingleton } from "@directus/sdk";
import type { FaqItem, OfferSummary, TestimonialItem } from "~/types/content";
import {
  type ContentPhoto,
  type ContentSeo,
  type FileField,
  mapFaqItems,
  mapNumberedSteps,
  mapOffers,
  mapPhoto,
  mapSeo,
  mapTestimonials,
  type NumberedStep,
  type RawSiteDefaults,
  str,
  TESTIMONIAL_FIELDS,
  TESTIMONIAL_SORT,
} from "./_shared";
import { type B2cSituation, mapSituation } from "./b2c-hub";

/**
 * Contenu du hub Organisations (B2B) — docs/03-organisations-hub.md.
 * Source : `org_hub_page` + `offers` (audience=organisation) + `faq_items`
 * (scope=org, périmètre propre au hub — symétrique du hub B2C) + `testimonials`
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
  offers_title?: string | null;
  situations_title?: string | null;
  situations_intro?: string | null;
  situation_a_title?: string | null;
  situation_a_body?: string | null;
  situation_a_audience?: string | null;
  situation_a_items?: unknown; // répéteur { text }
  situation_a_result?: string | null;
  situation_a_takeaway_label?: string | null;
  situation_a_takeaway_body?: string | null;
  situation_a_price?: string | null;
  situation_a_duration?: string | null;
  situation_a_cta_label?: string | null;
  situation_a_cta_link?: string | null;
  situation_b_title?: string | null;
  situation_b_body?: string | null;
  situation_b_audience?: string | null;
  situation_b_items?: unknown;
  situation_b_result?: string | null;
  situation_b_takeaway_label?: string | null;
  situation_b_takeaway_body?: string | null;
  situation_b_price?: string | null;
  situation_b_duration?: string | null;
  situation_b_cta_label?: string | null;
  situation_b_cta_link?: string | null;
  situation_c_title?: string | null;
  situation_c_body?: string | null;
  situation_c_audience?: string | null;
  situation_c_items?: unknown;
  situation_c_result?: string | null;
  situation_c_takeaway_label?: string | null;
  situation_c_takeaway_body?: string | null;
  situation_c_price?: string | null;
  situation_c_duration?: string | null;
  situation_c_cta_label?: string | null;
  situation_c_cta_link?: string | null;
  method_title?: string | null;
  method_intro?: string | null;
  method_steps?: unknown; // répéteur number + title + description
  differentiator_title?: string | null;
  differentiator_body?: string | null; // rich text
  audience_title?: string | null;
  audience_body?: string | null;
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

/**
 * Carte « enjeu » du hub B2B : la carte B2C commune, plus ce que le run 16 y a
 * ajouté — un 2e encadré au libellé libre (« Ce que ça vous évite », « Pourquoi ça
 * compte »…) et la ligne investissement/format juste au-dessus du bouton.
 */
export interface OrgSituation extends B2cSituation {
  /** 2e encadré (masqué si son texte est vide) ; le libellé change d'une offre à l'autre. */
  takeaway: { label: string; body: string } | null;
  /** « Investissement : … » — saisi sur la carte, sinon repris de la fiche d'offre liée. */
  price: string | null;
  /** « Format : … » — même règle de repli. */
  duration: string | null;
}

export interface OrgHubContent {
  /** Source du `h1` (null = fallback d'affichage). */
  accrocheTitle: string | null;
  accrocheSubtitle: string | null;
  accrocheBody: string | null;
  accrocheSignature: string | null;
  /** Illustration d'accroche optionnelle (Directus) — masquée si absente. */
  accrochePhoto: ContentPhoto | null;
  /** Titre de la section offres (cartes dynamiques). */
  offersTitle: string;
  offers: OfferSummary[];
  /** « Trois enjeux, trois accompagnements » — titre/intro + cartes détaillées.
   * Renseignées en back-office → remplacent les cartes offres compactes. */
  situationsTitle: string | null;
  situationsIntro: string | null;
  situations: OrgSituation[];
  method: { title: string; intro: string | null; steps: NumberedStep[] } | null;
  differentiator: { title: string; bodyHtml: string } | null;
  /** « Vous êtes RH ou dirigeant ? » — titre + paragraphe + phrase de clôture. */
  audience: { title: string; body: string | null; conclusion: string | null } | null;
  /** FAQ du hub (scope=org) ; section masquée tant qu'aucune question n'y est rangée. */
  faq: FaqItem[];
  testimonialsTitle: string;
  testimonials: TestimonialItem[];
  /** Toujours présent (conversion) ; fallbacks = garde-fous d'affichage. */
  cta: { title: string; body: string | null; label: string; subtext: string | null };
  seo: ContentSeo;
}

/** Signature du sanitizer injecté (cf. `sanitizeRichText`). */
type Sanitize = (html?: string | null) => string;

/**
 * Ajoute à une carte B2C les éléments propres au hub B2B. Investissement et format
 * **retombent sur la fiche de l'offre liée** quand ils ne sont pas saisis sur la
 * carte : un prix se change alors à un seul endroit, et le hub ne peut pas
 * annoncer autre chose que la page d'offre (retour Éléonore 2026-09-11).
 */
export function mapOrgSituation(
  base: B2cSituation | null,
  raw: { takeawayLabel?: unknown; takeawayBody?: unknown; price?: unknown; duration?: unknown },
  offers: OfferSummary[],
): OrgSituation | null {
  if (!base) return null;
  const linked = offers.find((o) => base.ctaLink === `/organisations/${o.slug}`);
  const takeawayBody = str(raw.takeawayBody);
  return {
    ...base,
    takeaway: takeawayBody
      ? { label: str(raw.takeawayLabel) || "À retenir", body: takeawayBody }
      : null,
    price: str(raw.price) || linked?.priceLabel || null,
    duration: str(raw.duration) || linked?.durationLabel || null,
  };
}

/** Compose le payload du hub (pur ; `sanitize` injecté pour le rich text). */
export function mapOrgHubContent(
  hub: RawOrgHub,
  offers: unknown,
  faq: unknown,
  testimonials: unknown,
  settings: RawSiteDefaults,
  assetBase: string,
  sanitize: Sanitize,
): OrgHubContent {
  const steps = mapNumberedSteps(hub.method_steps);
  const methodTitle = str(hub.method_title);
  const methodIntro = str(hub.method_intro);
  const diffTitle = str(hub.differentiator_title);
  const diffHtml = sanitize(hub.differentiator_body);
  const audienceTitle = str(hub.audience_title);
  const audienceBody = str(hub.audience_body);
  const audienceConclusion = str(hub.audience_conclusion);
  const offerSummaries = mapOffers(offers, "organisation");
  const situations = [
    mapOrgSituation(
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
        "/organisations/audit-rh",
      ),
      {
        takeawayLabel: hub.situation_a_takeaway_label,
        takeawayBody: hub.situation_a_takeaway_body,
        price: hub.situation_a_price,
        duration: hub.situation_a_duration,
      },
      offerSummaries,
    ),
    mapOrgSituation(
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
        "/organisations/carte-des-talents",
      ),
      {
        takeawayLabel: hub.situation_b_takeaway_label,
        takeawayBody: hub.situation_b_takeaway_body,
        price: hub.situation_b_price,
        duration: hub.situation_b_duration,
      },
      offerSummaries,
    ),
    mapOrgSituation(
      mapSituation(
        {
          title: hub.situation_c_title,
          body: hub.situation_c_body,
          audience: hub.situation_c_audience,
          items: hub.situation_c_items,
          result: hub.situation_c_result,
          ctaLabel: hub.situation_c_cta_label,
          ctaLink: hub.situation_c_cta_link,
        },
        "/organisations/de-l-expert-au-manager",
      ),
      {
        takeawayLabel: hub.situation_c_takeaway_label,
        takeawayBody: hub.situation_c_takeaway_body,
        price: hub.situation_c_price,
        duration: hub.situation_c_duration,
      },
      offerSummaries,
    ),
  ].filter((s): s is OrgSituation => s !== null);

  return {
    accrocheTitle: str(hub.accroche_title) || null,
    accrocheSubtitle: str(hub.accroche_subtitle) || null,
    accrocheBody: str(hub.accroche_body) || null,
    accrocheSignature: str(hub.accroche_signature) || null,
    accrochePhoto: mapPhoto(hub.accroche_photo, assetBase),
    offersTitle: str(hub.offers_title) || "Mes offres pour les organisations",
    offers: offerSummaries,
    situationsTitle: str(hub.situations_title) || null,
    situationsIntro: str(hub.situations_intro) || null,
    situations,
    method:
      methodTitle || methodIntro || steps.length
        ? { title: methodTitle, intro: methodIntro || null, steps }
        : null,
    differentiator: diffTitle || diffHtml ? { title: diffTitle, bodyHtml: diffHtml } : null,
    audience:
      audienceTitle || audienceBody || audienceConclusion
        ? {
            title: audienceTitle,
            body: audienceBody || null,
            conclusion: audienceConclusion || null,
          }
        : null,
    faq: mapFaqItems(faq, sanitize),
    testimonialsTitle: str(hub.testimonials_title) || "Ils m'ont fait confiance",
    testimonials: mapTestimonials(testimonials, assetBase),
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

  const [hub, offers, faq, testimonials, settings] = await Promise.all([
    client.request(
      readSingleton("org_hub_page", {
        fields: [
          "accroche_title",
          "accroche_subtitle",
          "accroche_body",
          "accroche_signature",
          "accroche_photo",
          "offers_title",
          "situations_title",
          "situations_intro",
          "situation_a_title",
          "situation_a_body",
          "situation_a_audience",
          "situation_a_items",
          "situation_a_result",
          "situation_a_takeaway_label",
          "situation_a_takeaway_body",
          "situation_a_price",
          "situation_a_duration",
          "situation_a_cta_label",
          "situation_a_cta_link",
          "situation_b_title",
          "situation_b_body",
          "situation_b_audience",
          "situation_b_items",
          "situation_b_result",
          "situation_b_takeaway_label",
          "situation_b_takeaway_body",
          "situation_b_price",
          "situation_b_duration",
          "situation_b_cta_label",
          "situation_b_cta_link",
          "situation_c_title",
          "situation_c_body",
          "situation_c_audience",
          "situation_c_items",
          "situation_c_result",
          "situation_c_takeaway_label",
          "situation_c_takeaway_body",
          "situation_c_price",
          "situation_c_duration",
          "situation_c_cta_label",
          "situation_c_cta_link",
          "method_title",
          "method_intro",
          "method_steps",
          "differentiator_title",
          "differentiator_body",
          "audience_title",
          "audience_body",
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
      readItems("faq_items", {
        filter: { status: { _eq: "published" }, scope: { _eq: "org" } },
        sort: ["sort"],
        limit: -1,
        fields: ["question", "answer"],
      }),
    ),
    client.request(
      readItems("testimonials", {
        filter: { status: { _eq: "published" }, audience: { _eq: "organisation" } },
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

  return mapOrgHubContent(
    hub as unknown as RawOrgHub,
    offers,
    faq,
    testimonials,
    settings as unknown as RawSiteDefaults,
    assetBase,
    sanitizeRichText,
  );
}
