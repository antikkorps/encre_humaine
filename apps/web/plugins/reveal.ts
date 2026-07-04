// Directive `v-reveal` — apparition douce (fade + légère montée) au scroll.
// docs/00-global.md §a11y / perf. Compositeur only (opacity/transform, cf. main.css) :
// zéro CLS, zéro reflow, impact Lighthouse négligeable.
//
// Garde-fous :
//  - respecte `prefers-reduced-motion: reduce` (ne fait rien).
//  - ne pose l'état caché QUE pour les éléments sous le pli → aucun flash pour le
//    contenu déjà visible (au-dessus du pli), qui n'est jamais masqué.
//  - sans JS : `mounted` ne s'exécute pas côté serveur → le contenu reste visible
//    (SSR ne pose pas `data-reveal`). Dégradation propre.
//  - IntersectionObserver natif, déconnecté après le reveal (pas de listener scroll).
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive("reveal", {
    mounted(el: HTMLElement) {
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

      const vh = window.innerHeight || document.documentElement.clientHeight;
      // Déjà (presque) visible → on ne masque pas (évite tout flash au-dessus du pli).
      if (el.getBoundingClientRect().top < vh * 0.9) return;

      el.setAttribute("data-reveal", "");
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              el.setAttribute("data-reveal", "in");
              observer.disconnect();
            }
          }
        },
        // On rétrécit le bas du viewport de 22 % : la section ne se révèle que
        // lorsque son haut a franchi ~78 % de la hauteur d'écran (bien dans le
        // champ de vision), pas dès qu'elle pointe en bas. threshold 0 = premier
        // contact avec cette zone (fiable quelle que soit la hauteur de section).
        { rootMargin: "0px 0px -22% 0px", threshold: 0 },
      );
      observer.observe(el);
    },
  });
});
