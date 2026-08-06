<script setup lang="ts">
// Carrousel d'articles — « Les Tentacules de L'Encre Humaine » (accueil, docs/01 §6).
// Défilement horizontal natif (scroll-snap, aucune dépendance JS) : on peut « se
// balader » à la souris, au doigt ou au clavier. Les flèches pilotent le scroll
// programmatique. Une carte finale « Voir toutes les ressources » clôt la piste.
// Pensé pour un fond SOMBRE (les cartes crème « ressortent »).
import type { ArticleSummary } from "~/types/content";

const props = withDefaults(
  defineProps<{
    articles: ArticleSummary[];
    seeAllTo: string;
    seeAllLabel: string;
    /** Fond de la section : pilote le contraste des flèches. */
    tone?: "dark" | "light";
  }>(),
  { tone: "dark" },
);

const track = ref<HTMLElement | null>(null);

/**
 * Largeur de carte. Sur grand écran on cale QUATRE cartes dans la piste
 * (`gap-6` = 1.5rem, soit 3 gouttières) : l'accueil affiche ainsi ses 3 articles
 * ET la carte poulpe finale sans avoir à défiler (demande Éléonore, 2026-08-06).
 * Sur /ressources, cela met simplement plus d'articles sous les yeux d'emblée.
 */
const CARD_WIDTH = "w-[82%] shrink-0 snap-start sm:w-[20rem] lg:w-[calc((100%-4.5rem)/4)]";

// Changement de jeu d'articles (filtre de /ressources) → retour au début, sinon
// on reste scrollé dans le vide.
watch(
  () => props.articles,
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
  <div
    role="group"
    aria-roledescription="carrousel"
    aria-label="Derniers articles des Tentacules"
  >
    <!-- Piste défilante : scroll-snap, débordant volontairement des marges pour
         un rendu « pleine largeur » agréable au doigt sur mobile. -->
    <ul
      ref="track"
      class="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-4 pb-2"
    >
      <li
        v-for="article in articles"
        :key="article.slug"
        :class="CARD_WIDTH"
      >
        <ArticleCard :article="article" />
      </li>

      <!-- Carte finale : accès à toute la rubrique (calquée sur la maquette). -->
      <li class="w-[82%] shrink-0 snap-start sm:w-[20rem] lg:w-[21rem]">
        <NuxtLink
          :to="seeAllTo"
          class="group flex h-full flex-col items-center justify-center gap-5 rounded-3xl border border-sand-400/30 bg-paper p-8 text-center shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
        >
          <OctopusMark class="h-16 w-16 text-sand-400 transition-transform duration-500 group-hover:scale-105" />
          <!-- `w-full` : sans largeur imposée, cet enfant de flex colonne se
               dimensionne sur son contenu et déborde de la carte au lieu de
               passer à la ligne (visible depuis que les cartes se resserrent
               pour tenir à quatre). -->
          <span class="w-full text-balance font-display text-xl font-semibold text-ink">
            {{ seeAllLabel }}
          </span>
          <span
            aria-hidden="true"
            class="grid h-12 w-12 place-items-center rounded-full bg-sand-400 text-ink transition-colors group-hover:bg-sand-500"
          >
            <Icon name="material-symbols:arrow-forward" class="h-6 w-6" />
          </span>
        </NuxtLink>
      </li>
    </ul>

    <!-- Flèches de navigation (le scroll natif reste la voie principale). -->
    <div class="mt-6 flex items-center gap-3">
      <button
        type="button"
        aria-label="Articles précédents"
        class="grid h-11 w-11 place-items-center rounded-full border transition-colors"
        :class="arrowClass"
        @click="scrollByCard(-1)"
      >
        <Icon name="material-symbols:arrow-forward" class="h-5 w-5 rotate-180" />
      </button>
      <button
        type="button"
        aria-label="Articles suivants"
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
