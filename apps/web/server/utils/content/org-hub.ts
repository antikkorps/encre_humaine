import { readItems, readSingleton } from "@directus/sdk";
import type { OfferSummary, TestimonialItem } from "~/types/content";
import {
  type ContentSeo,
  type FileField,
  mapNumberedSteps,
  mapOffers,
  mapSeo,
  mapStringList,
  mapTestimonials,
  type NumberedStep,
  type RawSiteDefaults,
  str,
} from "./_shared";

/**
 * Contenu du hub Organisations (B2B) — docs/03-organisations-hub.md.
 * Source : `org_hub_page` + `offers` (audience=organisation) + `testimonials`
 * (b2b) + `site_settings`. **La page oriente, elle ne détaille pas** : on ne lit
 * que le résumé des offres (titre/slug/phrase/durée/tarif), le lien mène au
 * gabarit `/organisations/[slug]`. Aucun champ rich text ici (vérifié snapshot).
 * Cartes offres **dynamiques** : ajouter une offre en back-office → carte sans dev.
 * Témoignages masqués si vides (docs/00 §États). Mappers communs dans `_shared`.
 */

export interface RawOrgHub {
  accroche_title?: string | null;
  accroche_body?: string | null;
  method_steps?: unknown; // répéteur number + title + description
  audience_items?: unknown; // répéteur text
  cta_title?: string | null;
  cta_label?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_image?: FileField;
  no_index?: boolean | null;
}

export interface OrgHubContent {
  /** Source du `h1` (null = fallback d'affichage). */
  accrocheTitle: string | null;
  accrocheBody: string | null;
  offers: OfferSummary[];
  methodSteps: NumberedStep[];
  audienceItems: string[];
  testimonials: TestimonialItem[];
  /** Toujours présent (conversion) ; fallbacks = garde-fous d'affichage. */
  cta: { title: string; label: string };
  seo: ContentSeo;
}

/** Compose le payload du hub (pur). */
export function mapOrgHubContent(
  hub: RawOrgHub,
  offers: unknown,
  testimonials: unknown,
  settings: RawSiteDefaults,
  assetBase: string,
): OrgHubContent {
  return {
    accrocheTitle: str(hub.accroche_title) || null,
    accrocheBody: str(hub.accroche_body) || null,
    offers: mapOffers(offers, "organisation"),
    methodSteps: mapNumberedSteps(hub.method_steps),
    audienceItems: mapStringList(hub.audience_items),
    testimonials: mapTestimonials(testimonials),
    cta: {
      title: str(hub.cta_title) || "Travaillons ensemble",
      label: str(hub.cta_label) || "Prendre rendez-vous",
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
          "accroche_body",
          "method_steps",
          "audience_items",
          "cta_title",
          "cta_label",
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
  );
}
