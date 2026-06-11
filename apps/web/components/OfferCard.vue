<script setup lang="ts">
// Carte d'offre pour les hubs B2B/B2C — docs/02-content-model.md §5 (`offers`),
// docs/03-organisations-hub.md / docs/04-particuliers-hub.md.
// Le lien pointe vers le gabarit d'offre selon le public (docs/05-offres-gabarit.md).
import type { OfferSummary } from "~/types/content";

const props = defineProps<{ offer: OfferSummary }>();

const to = computed(() => {
  const base = props.offer.audience === "organisation" ? "/organisations" : "/particuliers";
  return `${base}/${props.offer.slug}`;
});

const accent = computed(() =>
  props.offer.audience === "organisation" ? "text-teal-700" : "text-orange-600",
);
</script>

<template>
  <article class="relative flex h-full flex-col rounded-2xl border border-teal-100 bg-white p-6 transition-shadow hover:shadow-md">
    <h3 class="font-display text-xl font-semibold text-teal-900">
      <NuxtLink :to="to" class="after:absolute after:inset-0">{{ offer.title }}</NuxtLink>
    </h3>
    <p class="mt-2 flex-1 text-sm text-teal-700">{{ offer.shortDescription }}</p>

    <dl class="mt-4 space-y-1 text-sm">
      <div v-if="offer.durationLabel" class="flex gap-2">
        <dt class="text-teal-500">Durée</dt>
        <dd class="text-teal-800">{{ offer.durationLabel }}</dd>
      </div>
      <div v-if="offer.priceLabel" class="flex gap-2">
        <dt class="text-teal-500">Tarif</dt>
        <dd class="text-teal-800">{{ offer.priceLabel }}</dd>
      </div>
    </dl>

    <span class="mt-4 text-sm font-medium" :class="accent">En savoir plus →</span>
  </article>
</template>
