/**
 * Sitemap : retire `/cgv` tant que l'interrupteur `show_cgv` est décoché.
 *
 * La route est auto-découverte (pages/cgv.vue) mais répond 404 quand les CGV sont
 * masquées (cf. server/utils/content/legal.ts) : la laisser au sitemap envoie
 * Google sur une page d'erreur, remontée « Exclue par la balise noindex » dans la
 * Search Console. Un `exclude` statique ne suffirait pas : recocher `show_cgv`
 * doit la faire revenir sans redéploiement.
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("sitemap:resolved", async (ctx) => {
    if ((await loadSiteFlags()).showCgv) return;
    ctx.urls = ctx.urls.filter((u) => new URL(u.loc, "http://x").pathname !== "/cgv");
  });
});
