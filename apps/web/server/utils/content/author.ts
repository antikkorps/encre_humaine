// Fiche autrice (E-E-A-T, audit SEO 2026-10-22) : Google et les IA pèsent
// l'expérience et l'identité de qui écrit. Saisie UNE fois dans `site_settings`,
// elle signe l'accueil et chaque ressource — pas de nom en dur dans les pages.
import type { AuthorInfo } from "~/types/content";
import { type FileField, mapPhoto, safeHref, str } from "./_shared";

export interface RawAuthorSettings {
  author_name?: string | null;
  author_title?: string | null;
  author_photo?: FileField;
  linkedin_url?: string | null;
}

/** Champs `site_settings` à demander à Directus pour composer la fiche. */
export const AUTHOR_SETTINGS_FIELDS = [
  "author_name",
  "author_title",
  "author_photo",
  "linkedin_url",
] as const;

/** `null` sans nom : une fiche anonyme n'apporte aucune confiance. */
export function mapAuthor(raw: RawAuthorSettings, assetBase: string): AuthorInfo | null {
  const name = str(raw.author_name);
  if (!name) return null;
  const photo = mapPhoto(raw.author_photo, assetBase);
  return {
    name,
    title: str(raw.author_title) || null,
    // Un ID brut n'a pas d'alt : le nom de la personne en tient lieu.
    photo: photo ? { ...photo, alt: photo.alt || name } : null,
    linkedinUrl: safeHref(raw.linkedin_url) || null,
  };
}
