<script setup lang="ts">
// Filtres par groupe de catégorie (« Tout », Organisations, Particuliers, Terrain).
// Mutualisés entre /ressources (carrousel des 3 dernières) et /ressources/tous
// (grille paginée) : un seul jeu de pastilles à faire évoluer, un seul rendu.
// `null` = aucun filtre actif (« Tout »).
import type { CategoryFilter } from "~/server/utils/content/resources";

const props = defineProps<{ filters: CategoryFilter[]; modelValue: string | null }>();
defineEmits<{ "update:modelValue": [string | null] }>();

const CHIP = "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors";
const ON = "border-teal-700 bg-teal-700 text-white shadow-soft";
const OFF = "border-ink/15 text-ink/70 hover:border-teal-300 hover:bg-teal-50";

/** Mots-clés du filtre actif (chrome de taxonomie) — rien sur « Tout ». */
const activeKeywords = computed(
  () => props.filters.find((f) => f.group === props.modelValue)?.keywords ?? null,
);
</script>

<template>
  <div v-if="filters.length" role="group" aria-label="Filtrer par thème">
    <div class="flex flex-wrap gap-2">
      <button
        type="button"
        :class="[CHIP, modelValue === null ? ON : OFF]"
        :aria-pressed="modelValue === null"
        @click="$emit('update:modelValue', null)"
      >
        Tout
      </button>
      <button
        v-for="filter in filters"
        :key="filter.group"
        type="button"
        :class="[CHIP, modelValue === filter.group ? ON : OFF]"
        :aria-pressed="modelValue === filter.group"
        @click="$emit('update:modelValue', filter.group)"
      >
        <Icon
          :name="`material-symbols:${filter.icon}`"
          class="mr-1 inline h-4 w-4 align-[-0.2em]"
          aria-hidden="true"
        />{{ filter.label }}
      </button>
    </div>
    <p v-if="activeKeywords" class="mt-3 text-sm text-ink/55">{{ activeKeywords }}</p>
  </div>
</template>
