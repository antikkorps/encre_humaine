import { serverEnv } from "../utils/env";

/**
 * Mode « page d'attente » (COMING_SOON=true) — masque l'intégralité du site le
 * temps de préparer les contenus, AVANT le lancement public.
 *
 * Pourquoi un middleware serveur et pas un simple overlay CSS : un overlay
 * laisse le vrai HTML servi → les robots le crawlent et peuvent l'indexer. Ici
 * on NE SERT PAS le contenu : toute route non autorisée renvoie la page
 * d'attente avec un `503 Service Unavailable` (code sémantiquement correct pour
 * « indisponible temporairement » : Google repasse plus tard, n'indexe pas et
 * ne pénalise pas) + `X-Robots-Tag: noindex`.
 *
 * Restent accessibles (allow-list) : la page d'attente elle-même, les assets de
 * rendu, le healthcheck, et tout le parcours d'inscription newsletter (API +
 * page de confirmation double opt-in) — c'est la seule action offerte aux
 * visiteurs pendant cette phase.
 *
 * Laissez-passer : une session Directus valide (éditrice/admin) ouvre le vrai
 * site pour relire/corriger le rendu avant l'ouverture — cf. hasValidDirectusSession.
 * Le public et les robots, sans session, ne voient que la page d'attente.
 *
 * Deux bascules, dans cet ordre :
 *  1. `COMING_SOON` (env, validée au boot) — le garde-fou d'infra : à `false`,
 *     la porte n'existe plus du tout (aucun appel Directus, coût nul) ;
 *  2. `site_settings.site_open` (Directus) — **l'interrupteur d'Éléonore** : à
 *     `true`, le site s'ouvre au public en moins d'une minute, sans
 *     redéploiement ni redémarrage du conteneur (retour du 2026-08-18 :
 *     « qu'elle puisse peut-être l'activer seule »).
 * Une fois l'ouverture confirmée, passer `COMING_SOON=false` retire la porte
 * définitivement (et avec elle la lecture Directus à chaque navigation).
 */

const COMING_SOON_PATH = "/coming-soon";

/** Routes/préfixes qui contournent la porte quand le mode est actif. */
const ALLOW_LIST: RegExp[] = [
  // La page d'attente elle-même (rendue en interne, cf. plus bas).
  /^\/coming-soon\/?$/,
  // Interrupteurs globaux (lus par le pied de page rendu en SSR pour l'éditrice).
  /^\/api\/site-flags\/?$/,
  // Parcours newsletter : inscription + confirmation double opt-in.
  /^\/api\/newsletter\/(subscribe|confirm)\/?$/,
  /^\/newsletter\/confirmation\/?$/,
  // Healthcheck Docker (docs/07 §7).
  /^\/api\/health\/?$/,
  // Assets de rendu Nuxt/Nitro (sinon la page d'attente casse) : bundle client,
  // payload, images (IPX), polices, scripts, icônes, îlots, favicon.
  /^\/_nuxt\//,
  /^\/_ipx\//,
  /^\/_fonts\//,
  /^\/_scripts\//,
  /^\/__nuxt(_island)?\//,
  /^\/api\/_nuxt_icon\//,
  /^\/(favicon\.ico|apple-touch-icon.*\.png|site\.webmanifest)$/,
];

/** robots.txt servi en mode attente : on interdit tout crawl. */
const ROBOTS_DISALLOW_ALL = "User-agent: *\nDisallow: /\n";

export default defineEventHandler(async (event) => {
  if (!serverEnv().COMING_SOON) return;
  // Ouverture pilotée depuis l'admin : le site redevient un site normal.
  if ((await loadSiteFlags()).siteOpen) return;

  const path = event.path.split("?")[0] ?? event.path;

  // robots.txt : interdiction explicite de tout crawl (prime sur @nuxtjs/seo).
  if (path === "/robots.txt") {
    setResponseHeader(event, "content-type", "text/plain; charset=utf-8");
    return ROBOTS_DISALLOW_ALL;
  }

  if (ALLOW_LIST.some((re) => re.test(path))) return;

  // Laissez-passer éditrice/admin : session Directus valide → on sert le vrai
  // site (prévisualisation des contenus avant ouverture). Sans cookie de
  // session, aucun appel réseau n'est déclenché (public/robots → 503 direct).
  if (await hasValidDirectusSession(event)) return;

  // À partir d'ici la route est masquée. noindex sur toutes les réponses.
  setResponseStatus(event, 503);
  setResponseHeader(event, "X-Robots-Tag", "noindex, nofollow");
  setResponseHeader(event, "Retry-After", 86400); // 24 h

  // Requêtes non-HTML (API, sondes…) : 503 léger, inutile de rendre la page.
  const accept = getRequestHeader(event, "accept") ?? "";
  if (!accept.includes("text/html")) {
    return { error: { code: "coming_soon", message: "Site en préparation." } };
  }

  // Navigation HTML : on rend la page d'attente (réutilise le composant Vue,
  // Turnstile + newsletter inclus) en interne et on la renvoie sous l'URL
  // demandée — pas de redirection, donc le 503 reste porté par cette URL.
  setResponseHeader(event, "content-type", "text/html; charset=utf-8");
  return await $fetch<string>(COMING_SOON_PATH, {
    headers: { accept: "text/html" },
  });
});
