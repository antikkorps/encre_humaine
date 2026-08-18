/**
 * Types de contenu consommés par les composants d'inventaire.
 * Vues « résumé » (cartes, listes) dérivées du modèle Directus — docs/02-content-model.md.
 *
 * NB : en phase 1, les types exacts seront dérivés du SDK Directus (DRY, jamais
 * ré-écrits). Ces interfaces sont la forme minimale dont les composants ont besoin
 * pour s'afficher ; les pages mappent le contenu Directus dessus.
 */
import type { Audience } from "@encre/shared/validation";

/** Audience élargie (les produits peuvent cibler les deux publics) — docs/02 §5. */
export type ProductAudience = Audience | "both";

/** Ligne de crédibilité (home_page.stats) — docs/02 §4. */
export interface Stat {
  value: string;
  label: string;
}

/** Image résolue côté page (URL d'asset Directus). `alt` vide = décoratif. */
export interface ContentPhoto {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
}

/** Témoignage réutilisable — `testimonials` (docs/02 §5). */
export interface TestimonialItem {
  quote: string;
  authorName: string;
  authorTitle?: string;
  company?: string;
  /** Secteur / enjeu, optionnel. */
  context?: string;
  audience?: Audience;
  /** Photo de la personne (bulle ronde) ; absente → le poulpe s'affiche. */
  photo?: ContentPhoto;
  /** Satisfaction globale 1–5 ; absente → aucune étoile. */
  rating?: number;
  /** Slugs d'offres où le témoignage est épinglé ; vide = toutes celles de son public. */
  offers: string[];
}

/**
 * Interrupteurs globaux du site (`site_settings`) exposés par `/api/site-flags` :
 * ouverture au public (porte « bientôt disponible ») et affichage des CGV.
 * Éditables par l'éditrice sans redéploiement ni redémarrage.
 */
export interface SiteFlags {
  siteOpen: boolean;
  showCgv: boolean;
}

/** Carte d'offre pour les hubs — sous-ensemble de `offers` (docs/02 §5). */
export interface OfferSummary {
  title: string;
  slug: string;
  audience: Audience;
  /** Clé d'icône éditoriale (optionnelle). */
  icon?: string;
  shortDescription: string;
  durationLabel?: string;
  /** Texte libre — ex. « 1 500 – 2 500 € HT ». Jamais un montant calculé. */
  priceLabel?: string;
}

/** Carte d'article de blog — sous-ensemble de `articles` (docs/02 §5). */
export interface ArticleSummary {
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  coverAlt?: string;
  categoryName?: string;
  /** Slug de la catégorie (lien/filtre). */
  categorySlug?: string;
  /** Groupe de catégorie (Organisations / Particuliers / Terrain) — filtre index. */
  categoryGroup?: string;
  /** Minutes de lecture. */
  readingTime?: number;
  /** ISO date (string) — formatée à l'affichage. */
  publishedAt?: string;
}

/**
 * Carte produit (boutique). Éditorial depuis `products` (Directus) + prix depuis
 * Stripe — docs/02 §5, docs/06-boutique.md. Aucun prix n'est stocké côté Directus.
 */
export interface ProductSummary {
  name: string;
  slug: string;
  tagline?: string;
  image?: string;
  imageAlt?: string;
  audience?: ProductAudience;
  /** Libellé prix déjà formaté (source : Stripe). Absent = prix indisponible. */
  priceLabel?: string;
  /** Disponibilité issue de Stripe (stock / produit actif). */
  available?: boolean;
}

/** Entrée de FAQ — `faq_items` (docs/02 §5). `answer` = HTML (rich text). */
export interface FaqItem {
  question: string;
  answer: string;
}

/** Item de navigation (en-tête / menu mobile) — docs/00-global.md §Layout. */
export interface NavItem {
  label: string;
  to: string;
}
