<script setup lang="ts">
// Ligne de crédibilité (chiffres clés) — docs/02-content-model.md §4 (home_page.stats).
// Registre « pop » : le NOMBRE de tête ressort en grand, le reste de la valeur
// (ex. « regards complémentaires ») reste en corps lisible → robuste quelle que
// soit la longueur (les `value` d'Éléonore sont des phrases, pas juste un nombre).
// Se masque proprement si vide (docs/00-global.md §États).
import type { Stat } from "~/types/content";

defineProps<{ stats: Stat[] }>();

// Sépare le préfixe numérique (« +10 », « 3 », « 1 ») du qualificatif qui suit.
function splitValue(v: string): { num: string; rest: string } {
  const m = v.match(/^\s*([+\-–—]?\s*\d[\d\s.,]*)(.*)$/);
  if (m?.[1]) return { num: m[1].trim(), rest: (m[2] ?? "").trim() };
  return { num: v, rest: "" };
}
</script>

<template>
  <dl
    v-if="stats.length"
    class="grid gap-10 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-orange-300/50"
  >
    <div v-for="(stat, i) in stats" :key="i" class="px-4 text-center sm:px-8">
      <dt class="sr-only">{{ stat.label }}</dt>
      <dd class="flex flex-col items-center">
        <span class="font-display text-5xl font-bold leading-none text-ink sm:text-6xl">
          {{ splitValue(stat.value).num }}
        </span>
        <span
          v-if="splitValue(stat.value).rest"
          class="mt-2 max-w-[12rem] text-balance font-display text-base font-semibold leading-snug text-ink/80"
        >
          {{ splitValue(stat.value).rest }}
        </span>
        <span aria-hidden="true" class="mt-4 block h-1 w-8 rounded-full bg-sand-400"></span>
        <span class="mt-3 block max-w-[15rem] text-balance text-sm font-medium leading-relaxed text-ink/65">
          {{ stat.label }}
        </span>
      </dd>
    </div>
  </dl>
</template>
