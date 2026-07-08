import type { ProviderGetImage } from "@nuxt/image";

/**
 * Provider @nuxt/image custom — transformations déléguées à **Directus** (qui
 * embarque sharp) plutôt qu'à IPX. Raison : le runtime Nuxt de prod est l'image
 * Docker `.output` minimale (pas de sharp) ; Directus, lui, sait redimensionner
 * et ré-encoder à la volée via les query params d'asset. Le navigateur charge
 * donc directement depuis `cms.encrehumaine.fr` (déjà autorisé par la CSP
 * `img-src`), sans proxy `/_ipx`.
 *
 * `src` = URL d'asset Directus COMPLÈTE (`${base}/assets/{id}`), telle que
 * produite par les loaders de contenu (`server/utils/content/_shared.ts`).
 *
 * ⚠️ @nuxt/image v2 : l'export par défaut d'un provider doit être une fonction
 * `setup()` qui renvoie l'objet provider (`resolveImage` fait `setup().getImage`).
 * En v1 on exportait directement `{ getImage }` → « setup is not a function ».
 * `defineProvider` de la lib fait exactement ce wrapping ; on l'inline pour ne
 * dépendre d'aucun chemin d'import interne.
 */
export const getImage: ProviderGetImage = (src, { modifiers } = { modifiers: {} }) => {
  const { width, height, quality, format, fit } = modifiers ?? {};
  const params = new URLSearchParams();
  if (width) params.set("width", String(width));
  if (height) params.set("height", String(height));
  if (quality) params.set("quality", String(quality));
  if (format && format !== "auto") params.set("format", String(format));
  if (fit) params.set("fit", String(fit));
  const qs = params.toString();
  return { url: qs ? `${src}${src.includes("?") ? "&" : "?"}${qs}` : src };
};

// v2 : provider = fonction setup() → { getImage }. (mémoïsé comme defineProvider)
const provider = { getImage };
export default () => provider;
