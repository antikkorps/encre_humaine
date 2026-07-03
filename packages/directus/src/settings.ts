// Réglages projet Directus versionnés — confort de navigation pour l'éditrice :
//  - Project URL : le logo Directus (haut gauche) renvoie vers le site public.
//  - Lien « Statistiques » dans la barre de modules → tableau de bord Umami.
// Idempotent : ne PATCH que si nécessaire, préserve une barre déjà personnalisée
// (n'ajoute le lien Umami qu'une seule fois). URLs vides (dev sans analytics) → ignorées.
import { get, patch } from "./api.ts";
import { config } from "./env.ts";

type ModuleBarItem = Record<string, unknown>;

/** Barre de modules par défaut de Directus (base de repli si non personnalisée). */
const DEFAULT_MODULE_BAR: ModuleBarItem[] = [
  { type: "module", id: "content", enabled: true },
  { type: "module", id: "users", enabled: true },
  { type: "module", id: "files", enabled: true },
  { type: "module", id: "insights", enabled: true },
];

const UMAMI_LINK_ID = "umami";

/** Route publique de chaque singleton → Preview URL Directus (Live Preview). */
const SINGLETON_PREVIEW_PATHS: Record<string, string> = {
  home_page: "/",
  about_page: "/a-propos",
  org_hub_page: "/organisations",
  b2c_hub_page: "/particuliers",
  resources_page: "/ressources",
  newsletter_page: "/newsletter",
  contact_page: "/contact",
};

interface RawSettings {
  project_url: string | null;
  module_bar: ModuleBarItem[] | null;
}

export async function bootstrapSettings(): Promise<void> {
  const current = await get<RawSettings>("/settings?fields=project_url,module_bar");
  const body: Record<string, unknown> = {};

  // 1. Project URL (logo → site public).
  if (config.siteUrl && current.project_url !== config.siteUrl) {
    body.project_url = config.siteUrl;
  }

  // 2. Lien Umami dans la barre de modules (ajouté une seule fois, barre préservée).
  if (config.umamiUrl) {
    const bar = current.module_bar ?? DEFAULT_MODULE_BAR;
    const present = bar.some((i) => i.id === UMAMI_LINK_ID || i.url === config.umamiUrl);
    if (!present) {
      body.module_bar = [
        ...bar,
        {
          type: "link",
          id: UMAMI_LINK_ID,
          name: "Statistiques",
          icon: "bar_chart",
          url: config.umamiUrl,
        },
      ];
    }
  }

  if (Object.keys(body).length > 0) await patch("/settings", body);

  // 3. Preview URL par singleton → Live Preview (panneau « page live » à côté du
  //    formulaire). `?preview=true` fait sauter le cache serveur (cachedContent).
  if (config.siteUrl) {
    for (const [collection, path] of Object.entries(SINGLETON_PREVIEW_PATHS)) {
      const url = `${config.siteUrl}${path}?preview=true`;
      const cur = await get<{ meta: { preview_url?: string | null } | null }>(
        `/collections/${collection}?fields=meta.preview_url`,
      );
      if (cur.meta?.preview_url !== url) {
        await patch(`/collections/${collection}`, { meta: { preview_url: url } });
      }
    }
  }
}
