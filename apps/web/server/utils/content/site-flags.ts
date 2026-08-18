import { readSingleton } from "@directus/sdk";
import type { SiteFlags } from "~/types/content";

/**
 * Interrupteurs globaux du site, pilotés par l'éditrice depuis `site_settings` :
 *
 *  - `site_open` : ouvre le site au public. Tant qu'il est décoché ET que
 *    `COMING_SOON=true` côté serveur, la porte « bientôt disponible » reste
 *    fermée (cf. server/middleware/coming-soon.ts). C'est l'interrupteur du
 *    jour J : Éléonore ouvre le site seule, sans redéploiement ni redémarrage.
 *  - `show_cgv` : affiche les CGV (lien de pied de page + page `/cgv`). Décoché
 *    tant qu'il n'y a pas de vente en ligne ; recocher les fait réapparaître.
 *
 * Défaut si Directus n'a pas (encore) le champ ou ne répond pas : **fermé** et
 * **CGV masquées** — l'état le plus prudent avant ouverture, et celui demandé.
 *
 * Mémoïsé 60 s (le middleware s'en sert à chaque navigation) avec repli sur la
 * dernière valeur connue en cas de panne : une coupure Directus ne doit pas
 * refermer un site déjà ouvert.
 */

const TTL_MS = 60_000;
const CLOSED: SiteFlags = { siteOpen: false, showCgv: false };

let cache: { at: number; value: SiteFlags } | null = null;

/** Champs bruts lus sur le singleton (booléens Directus). */
export interface RawSiteFlags {
  site_open?: boolean | null;
  show_cgv?: boolean | null;
}

/** Coercion pure : seul `true` ouvre (une valeur absente/nulle reste fermée). */
export function mapSiteFlags(raw: RawSiteFlags | null | undefined): SiteFlags {
  return {
    siteOpen: raw?.site_open === true,
    showCgv: raw?.show_cgv === true,
  };
}

/** Interrupteurs courants (mémoïsés 60 s, dernière valeur connue si Directus tombe). */
export async function loadSiteFlags(): Promise<SiteFlags> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) return cache.value;
  try {
    // `*` (cf. TESTIMONIAL_FIELDS) : demander nommément `site_open` à une instance
    // pas encore bootstrapée ferait échouer la requête ; le singleton tient sur
    // une ligne, autant tout lire.
    const raw = (await directusServer().request(
      readSingleton("site_settings", { fields: ["*"] }),
    )) as unknown as RawSiteFlags;
    cache = { at: now, value: mapSiteFlags(raw) };
    return cache.value;
  } catch (err) {
    console.error("[site-flags] lecture Directus impossible :", err);
    return cache?.value ?? CLOSED;
  }
}
