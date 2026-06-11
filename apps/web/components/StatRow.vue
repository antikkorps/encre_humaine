<script setup lang="ts">
// Ligne de crédibilité (chiffres clés) — docs/02-content-model.md §4 (home_page.stats).
// Se masque proprement si vide (docs/00-global.md §États).
import type { Stat } from "~/types/content";

defineProps<{ stats: Stat[] }>();
</script>

<template>
  <dl
    v-if="stats.length"
    class="grid grid-cols-2 gap-6 sm:grid-cols-4"
  >
    <div v-for="(stat, i) in stats" :key="i" class="text-center">
      <dt class="sr-only">{{ stat.label }}</dt>
      <dd>
        <span class="block font-display text-3xl font-bold text-brand-accent">
          {{ stat.value }}
        </span>
        <span class="mt-1 block text-sm text-teal-700">{{ stat.label }}</span>
      </dd>
    </div>
  </dl>
</template>
