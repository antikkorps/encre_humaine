/**
 * Interrupteurs globaux du site — `GET /api/site-flags`.
 * Consommé par le pied de page (affichage du lien CGV). Aucune mise en cache
 * Nitro ici : `loadSiteFlags()` mémoïse déjà 60 s en mémoire, et c'est CE cache
 * que lit aussi le middleware « bientôt disponible » (une seule politique).
 */
export default defineEventHandler(() => loadSiteFlags());
