<script setup lang="ts">
// Ligne de crédibilité (chiffres clés) — docs/02-content-model.md §4 (home_page.stats).
// Bandeau à gros chiffres navy, séparés par des filets dorés (registre « pop »).
// Se masque proprement si vide (docs/00-global.md §États).
import type { Stat } from "~/types/content";

defineProps<{ stats: Stat[] }>();
</script>

<template>
  <dl
    v-if="stats.length"
    class="grid gap-10 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-orange-300/50"
  >
    <div v-for="(stat, i) in stats" :key="i" class="px-4 text-center sm:px-8">
      <dt class="sr-only">{{ stat.label }}</dt>
      <dd>
        <span class="block font-display text-5xl font-bold text-ink sm:text-6xl">
          {{ stat.value }}
        </span>
        <span aria-hidden="true" class="mx-auto mt-3 block h-1 w-8 rounded-full bg-sand-400"></span>
        <span class="mt-3 block whitespace-pre-line text-sm font-medium leading-relaxed text-ink/70">
          {{ stat.label }}
        </span>
      </dd>
    </div>
  </dl>
</template>
