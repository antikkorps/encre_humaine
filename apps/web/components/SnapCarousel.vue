<script setup lang="ts">
// Piste défilante réutilisable — scroll-snap natif, zéro dépendance JS : on se
// « balade » à la souris, au doigt ou au clavier, les flèches ne font que piloter
// le scroll. Extrait d'ArticleCarousel au run 15, quand la « preuve par l'exemple »
// a eu besoin exactement du même comportement pour des cartes d'une autre nature.
//
// Le parent fournit les éléments (slot par défaut, un `<li>` par carte) et, s'il y
// a lieu, une carte finale d'appel à l'action (slot `tail`).
const props = withDefaults(
  defineProps<{
    /** Décrit la piste aux lecteurs d'écran (ex. « Derniers articles »). */
    label: string;
    /** Libellés des flèches, adaptés au contenu. */
    prevLabel?: string;
    nextLabel?: string;
    /** Fond de la section : pilote le contraste des flèches. */
    tone?: "dark" | "light";
    /**
     * Change de valeur → retour au début de la piste. Sans cela, un changement de
     * jeu de cartes (filtre de /ressources) laisse la vue scrollée dans le vide.
     */
    resetKey?: unknown;
  }>(),
  { tone: "dark", prevLabel: "Précédent", nextLabel: "Suivant" },
);

const track = ref<HTMLElement | null>(null);

watch(
  () => props.resetKey,
  () => track.value?.scrollTo({ left: 0 }),
);

const arrowClass = computed(() =>
  props.tone === "dark"
    ? "border-paper/25 text-paper/80 hover:border-sand-400 hover:text-sand-300"
    : "border-ink/15 text-ink/70 hover:border-sand-400 hover:text-sand-500",
);

/** Défile d'environ une carte (85 % de la largeur visible) dans le sens donné. */
function scrollByCard(direction: 1 | -1) {
  const el = track.value;
  if (!el) return;
  el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
}
</script>

<template>
  <div role="group" aria-roledescription="carrousel" :aria-label="label">
    <!-- Piste débordant volontairement des marges : rendu « pleine largeur »
         agréable au doigt sur mobile. -->
    <ul
      ref="track"
      class="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-4 pb-2"
    >
      <slot />
      <slot name="tail" />
    </ul>

    <!-- Flèches (le scroll natif reste la voie principale). -->
    <div class="mt-6 flex items-center gap-3">
      <button
        type="button"
        :aria-label="prevLabel"
        class="grid h-11 w-11 place-items-center rounded-full border transition-colors"
        :class="arrowClass"
        @click="scrollByCard(-1)"
      >
        <Icon name="material-symbols:arrow-forward" class="h-5 w-5 rotate-180" />
      </button>
      <button
        type="button"
        :aria-label="nextLabel"
        class="grid h-11 w-11 place-items-center rounded-full border transition-colors"
        :class="arrowClass"
        @click="scrollByCard(1)"
      >
        <Icon name="material-symbols:arrow-forward" class="h-5 w-5" />
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Masque la barre de défilement (le geste et les flèches suffisent). */
.no-scrollbar {
  scrollbar-width: none;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
