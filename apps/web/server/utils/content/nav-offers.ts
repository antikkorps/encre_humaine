import { readItems } from "@directus/sdk";
import type { OfferSummary } from "~/types/content";
import { mapOffers } from "./_shared";

/**
 * Clés d'icône réellement embarquées côté client (miroir de `clientBundle.icons`
 * dans nuxt.config.ts). Une clé hors de cette liste ne s'affiche pas : on replie
 * plutôt que de laisser un trou dans le menu.
 */
const NAV_ICONS = new Set([
  "analytics",
  "balance",
  "checklist",
  "description",
  "diversity-3",
  "explore",
  "flag",
  "forum",
  "group",
  "groups",
  "handshake",
  "hub",
  "insights",
  "key",
  "layers",
  "lightbulb",
  "menu-book",
  "person-search",
  "psychology",
  "record-voice-over",
  "rocket-launch",
  "route",
  "school",
  "schedule",
  "science",
  "self-improvement",
  "settings",
  "target",
  "timeline",
  "trending-up",
  "visibility",
  "workspace-premium",
]);

/**
 * Offres publiées, groupées par public — alimente les menus déroulants de la
 * navigation ET les colonnes du pied de page.
 *
 * Pourquoi un endpoint dédié plutôt que des listes en dur : jusqu'au run 15, une
 * même offre s'appelait « Compétences & parcours » sur l'accueil, « Compétences &
 * parcours professionnels » dans le pied de page et autrement encore sur sa page
 * (retour Éléonore, audit du 2026-09-08 : « harmoniser le nom partout ? »). Le
 * titre Directus fait désormais foi : elle renomme une offre, tout le site suit,
 * sans déploiement. Charge utile minimale (titre, slug, phrase courte, icône) —
 * c'est de la navigation, pas du contenu de page.
 */
export interface NavOffers {
  organisations: OfferSummary[];
  particuliers: OfferSummary[];
}

export async function loadNavOffers(): Promise<NavOffers> {
  const client = directusServer();
  const offers = await client.request(
    readItems("offers", {
      filter: { status: { _eq: "published" } },
      sort: ["sort"],
      fields: ["title", "slug", "audience", "icon", "short_description"],
    }),
  );
  const all = mapOffers(offers, "organisation").map(navIcon);
  return {
    organisations: all.filter((o) => o.audience === "organisation"),
    particuliers: all.filter((o) => o.audience === "particulier"),
  };
}

/**
 * Garantit une clé d'icône affichable. `offers.icon` a longtemps été une saisie
 * libre jamais rendue : la prod porte des valeurs comme `rocket_launch` (Iconify
 * attend des tirets) ou `search` (absente du clientBundle) qui donneraient un rond
 * vide dans le menu. Normalisation + repli par public.
 */
export function navIcon(offer: OfferSummary): OfferSummary {
  const key = (offer.icon ?? "").trim().replace(/_/g, "-");
  const fallback = offer.audience === "organisation" ? "groups" : "explore";
  return { ...offer, icon: NAV_ICONS.has(key) ? key : fallback };
}
