<script setup lang="ts">
// Ligne de crédibilité (chiffres clés) — docs/02-content-model.md §4 (home_page.stats).
// Se masque proprement si vide (docs/00-global.md §États).
import type { Stat } from "~/types/content";

defineProps<{ stats: Stat[] }>();
</script>

<template>
  <dl
    v-if="stats.length"
    class="flex flex-col items-center gap-8 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-16 sm:gap-y-8"
  >
    <div v-for="(stat, i) in stats" :key="i" class="text-center sm:min-w-[8rem]">
      <dt class="sr-only">{{ stat.label }}</dt>
      <dd>
        <span
          class="block font-display text-4xl font-bold text-teal-700 sm:text-5xl"
        >
          {{ stat.value }}
        </span>
        <span aria-hidden="true" class="mx-auto mt-2 block h-1 w-8 rounded-full bg-sand-400"></span>
        <span class="mt-2 block text-sm font-medium text-ink/70">{{ stat.label }}</span>
      </dd>
    </div>
  </dl>
</template>
