import { readItems, readSingleton } from "@directus/sdk";
import { type ContentSeo, mapSeo, type RawSiteDefaults, str } from "./_shared";

/**
 * Document légal — `/mentions-legales`, `/cgv`, `/confidentialite`, `/cgu`
 * (docs/10-legal.md). Source : `legal_documents` (par slug). `body` est du rich
 * text → **assaini serveur** (sanitizer injecté). Une **table des matières** est
 * dérivée des `<h2>` (docs longs). `null` si aucun document publié pour ce slug.
 */

export interface RawLegalDocument {
  title?: string | null;
  body?: string | null; // rich text
  date_updated?: string | null;
}

export interface TocEntry {
  id: string;
  text: string;
}

export interface LegalDocument {
  title: string;
  /** HTML assaini, `<h2>` ancrés (id) pour la table des matières. */
  html: string;
  toc: TocEntry[];
  /** Date de dernière mise à jour (ISO) si connue. */
  updatedAt: string | null;
  seo: ContentSeo;
}

/** Signature du sanitizer injecté (cf. `sanitizeRichText`). */
type Sanitize = (html?: string | null) => string;

/** Slug d'ancre stable à partir d'un texte de titre. */
export function slugifyHeading(text: string): string {
  const slug = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // diacritiques combinants
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "section";
}

/**
 * Ancre les `<h2>` (id unique) et extrait la table des matières. Opère sur du HTML
 * **déjà assaini** (les id ajoutés ici sont des slugs sûrs, post-sanitize).
 */
export function buildToc(html: string): { html: string; toc: TocEntry[] } {
  const toc: TocEntry[] = [];
  const used = new Set<string>();
  const out = html.replace(/<h2>([\s\S]*?)<\/h2>/gi, (_match, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    if (!text) return `<h2>${inner}</h2>`;
    let id = slugifyHeading(text);
    const base = id;
    let n = 2;
    while (used.has(id)) id = `${base}-${n++}`;
    used.add(id);
    toc.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { html: out, toc };
}

/** Compose le document (pur ; `sanitize` injecté pour le corps rich text). */
export function mapLegalDocument(
  raw: RawLegalDocument,
  settings: RawSiteDefaults,
  assetBase: string,
  sanitize: Sanitize,
): LegalDocument {
  const { html, toc } = buildToc(sanitize(raw.body));
  const title = str(raw.title);
  return {
    title,
    html,
    toc,
    updatedAt: str(raw.date_updated) || null,
    // legal_documents n'a pas de bloc SEO propre : titre du doc + défauts site.
    seo: mapSeo({ meta_title: title }, settings, assetBase),
  };
}

/** Charge un document légal par slug (Directus published, lecture seule). */
export async function loadLegalDocument(slug: string): Promise<LegalDocument | null> {
  const client = directusServer();
  const assetBase = useRuntimeConfig().public.directusPublicUrl;

  const [doc] = (await client.request(
    readItems("legal_documents", {
      filter: { status: { _eq: "published" }, slug: { _eq: slug } },
      limit: 1,
      fields: ["title", "slug", "body", "date_updated"],
    }),
  )) as unknown as RawLegalDocument[];

  if (!doc) return null;

  const settings = (await client.request(
    readSingleton("site_settings", {
      fields: ["brand_name", "default_meta_description", "default_og_image"],
    }),
  )) as unknown as RawSiteDefaults;

  return mapLegalDocument(doc, settings, assetBase, sanitizeRichText);
}
