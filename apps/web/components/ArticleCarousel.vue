<script setup lang="ts">
// Carrousel d'articles — « Les Tentacules de L'Encre Humaine » (accueil, docs/01 §6).
// La mécanique de défilement vit dans SnapCarousel ; ici, les cartes et la carte
// finale « Voir toutes les ressources » qui clôt la piste.
// Pensé pour un fond SOMBRE (les cartes crème « ressortent »).
import type { ArticleSummary } from "~/types/content";

withDefaults(
  defineProps<{
    articles: ArticleSummary[];
    seeAllTo: string;
    seeAllLabel: string;
    /** Fond de la section : pilote le contraste des flèches. */
    tone?: "dark" | "light";
  }>(),
  { tone: "dark" },
);

/**
 * Largeur de carte. Piste abandonnée : les resserrer pour faire tenir les quatre
 * cartes d'un coup (3 articles + poulpe) donnait des titres sur trois lignes et
 * un chapô tassé et illisible. On garde la largeur de la maquette ; la 4e carte
 * dépasse un peu, ce qui est précisément le signal de
 * défilement attendu d'un carrousel. L'appel à l'action reste à un cran de
 * flèche puisque la piste est limitée à 3 articles (2026-08-06).
 */
const CARD_WIDTH = "w-[82%] shrink-0 snap-start sm:w-[20rem] lg:w-[21rem]";
</script>

<template>
  <SnapCarousel
    label="Derniers articles des Tentacules"
    prev-label="Articles précédents"
    next-label="Articles suivants"
    :tone="tone"
    :reset-key="articles"
  >
    <li v-for="article in articles" :key="article.slug" :class="CARD_WIDTH">
      <ArticleCard :article="article" />
    </li>

    <!-- Carte finale : accès à toute la rubrique (calquée sur la maquette). -->
    <template #tail>
      <li :class="CARD_WIDTH">
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
    </template>
  </SnapCarousel>
</template>
