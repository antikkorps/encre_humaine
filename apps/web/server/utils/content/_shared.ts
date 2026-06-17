/**
 * Helpers partagés des loaders de contenu (DRY — docs/CLAUDE.md §Principes).
 * Coercion des champs Directus (`unknown` pour les répéteurs JSON, `string |
 * DirectusFile` pour les fichiers) et résolution SEO commune à toutes les pages.
 * Tout est **pur** (testable sans réseau).
 */
import type { Audience } from "@encre/shared/validation";
import type { FaqItem, OfferSummary, TestimonialItem } from "~/types/content";

export interface RawFileRef {
  id?: string;
  title?: string | null;
  description?: string | null;
  width?: number | null;
  height?: number | null;
}

/**
 * Champ fichier Directus tel que sélectionné par les loaders : **ID brut**
 * (string), car `directus_files` n'est pas dans le `Schema` typé généré
 * (cf. shop.ts). La forme objet reste tolérée (tests, évolution future).
 */
export type FileField = string | RawFileRef | null | undefined;

/** Image résolue côté page. `alt` vide = décoratif (pas de métadonnée fichier). */
export interface ContentPhoto {
  url: string;
  alt: string;
  width: number | null;
  height: number | null;
}

export interface ContentSeo {
  title: string;
  description: string | null;
  ogImage: string | null;
  noIndex: boolean;
}

/** Bloc SEO commun aux singletons indexables (docs/02 §3). */
export interface RawSeo {
  meta_title?: string | null;
  meta_description?: string | null;
  og_image?: FileField;
  no_index?: boolean | null;
}

/** Défauts SEO globaux (`site_settings`, docs/02 §4). */
export interface RawSiteDefaults {
  brand_name?: string | null;
  default_meta_description?: string | null;
  default_og_image?: FileField;
}

/** Chaîne nettoyée, ou "" si absente/non-chaîne. */
export function str(val: unknown): string {
  return typeof val === "string" ? val.trim() : "";
}

/** Sous-ensemble objet d'un tableau (répéteur JSON Directus). */
export function records(val: unknown): Record<string, unknown>[] {
  return Array.isArray(val)
    ? val.filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
    : [];
}

export function fileId(ref: FileField): string | null {
  if (!ref) return null;
  return typeof ref === "string" ? ref : (ref.id ?? null);
}

export function fileUrl(ref: FileField, assetBase: string): string | null {
  const id = fileId(ref);
  return id ? `${assetBase}/assets/${id}` : null;
}

/** Alt depuis le titre/description du fichier (vide si ID brut ou non renseigné). */
export function fileAlt(ref: FileField): string {
  if (!ref || typeof ref === "string") return "";
  return str(ref.title) || str(ref.description);
}

export function mapPhoto(ref: FileField, assetBase: string): ContentPhoto | null {
  const url = fileUrl(ref, assetBase);
  if (!url) return null;
  const meta = ref && typeof ref === "object" ? ref : {};
  return { url, alt: fileAlt(ref), width: meta.width ?? null, height: meta.height ?? null };
}

/** Liste de chaînes depuis un répéteur (`["x"]` ou `[{ text|value }]`), vide filtré. */
export function mapStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((t) => {
      if (typeof t === "string") return t.trim();
      if (t && typeof t === "object")
        return (
          str((t as Record<string, unknown>).text) || str((t as Record<string, unknown>).value)
        );
      return "";
    })
    .filter((t): t is string => t !== "");
}

/**
 * Résout le SEO d'une page : champs de la page, fallback `site_settings`,
 * OG image → URL d'asset (docs/00-global §SEO).
 */
export function mapSeo(page: RawSeo, defaults: RawSiteDefaults, assetBase: string): ContentSeo {
  return {
    title: str(page.meta_title) || str(defaults.brand_name) || "L'Encre Humaine",
    description: str(page.meta_description) || str(defaults.default_meta_description) || null,
    ogImage:
      fileUrl(page.og_image, assetBase) ?? fileUrl(defaults.default_og_image, assetBase) ?? null,
    noIndex: page.no_index === true,
  };
}

/** Audience valide (`organisation`|`particulier`) ou `undefined`. */
export function asAudience(val: unknown): Audience | undefined {
  return val === "organisation" || val === "particulier" ? val : undefined;
}

/**
 * Témoignage réutilisable (home featured, hubs, pages offres). Requiert une
 * citation ; renvoie `null` si absent ou relation M2O non résolue (string).
 */
export function mapTestimonialItem(raw: unknown): TestimonialItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const quote = str(r.quote);
  if (!quote) return null;
  return {
    quote,
    authorName: str(r.author_name),
    authorTitle: str(r.author_title) || undefined,
    company: str(r.company) || undefined,
    context: str(r.context) || undefined,
    audience: asAudience(r.audience),
  };
}

/** Liste de témoignages publiés (filtrée en amont par audience) ; vides exclus. */
export function mapTestimonials(raws: unknown): TestimonialItem[] {
  return (Array.isArray(raws) ? raws : [])
    .map(mapTestimonialItem)
    .filter((t): t is TestimonialItem => t !== null);
}

/** Sous-ensemble `offers` consommé en carte de hub (docs/02 §5). */
export interface RawOffer {
  title?: string | null;
  slug?: string | null;
  audience?: string | null;
  icon?: string | null;
  short_description?: string | null;
  duration_label?: string | null;
  price_label?: string | null;
}

/** Carte d'offre (résumé) ; `null` si titre ou slug manquant. `fallback` = audience du hub. */
export function mapOfferSummary(raw: RawOffer, fallback: Audience): OfferSummary | null {
  const title = str(raw.title);
  const slug = str(raw.slug);
  if (!title || !slug) return null;
  return {
    title,
    slug,
    audience: asAudience(raw.audience) ?? fallback,
    icon: str(raw.icon) || undefined,
    shortDescription: str(raw.short_description),
    durationLabel: str(raw.duration_label) || undefined,
    priceLabel: str(raw.price_label) || undefined,
  };
}

export function mapOffers(raws: unknown, fallback: Audience): OfferSummary[] {
  return (Array.isArray(raws) ? (raws as RawOffer[]) : [])
    .map((r) => mapOfferSummary(r, fallback))
    .filter((o): o is OfferSummary => o !== null);
}

/** Étape numérotée (méthode B2B, étapes contact). `number` tolère number|string. */
export interface NumberedStep {
  number: string;
  title: string;
  description: string;
}

export function mapNumberedSteps(raw: unknown): NumberedStep[] {
  return records(raw)
    .map((s) => ({
      number: typeof s.number === "number" ? String(s.number) : str(s.number),
      title: str(s.title),
      description: str(s.description),
    }))
    .filter((s) => s.title !== "" || s.description !== "");
}

/**
 * FAQ (`faq_items`, filtrée par scope en amont) — hubs B2C, page Contact.
 * `answer` est du `input-rich-text-html` → **assaini** via le `sanitize` injecté
 * (docs/06 §1). Entrées sans question ni réponse exclues.
 */
export function mapFaqItems(raw: unknown, sanitize: (html?: string | null) => string): FaqItem[] {
  return records(raw)
    .map((f) => ({ question: str(f.question), answer: sanitize(f.answer as string | null) }))
    .filter((f) => f.question !== "" || f.answer !== "");
}
