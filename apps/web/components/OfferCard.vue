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

const isOrg = computed(() => props.offer.audience === "organisation");
const accent = computed(() => (isOrg.value ? "text-teal-700" : "text-orange-600"));
const topBar = computed(() => (isOrg.value ? "bg-teal-500" : "bg-orange-400"));
</script>

<template>
  <article
    class="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-ink/5 bg-white p-7 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
  >
    <span aria-hidden="true" class="absolute inset-x-0 top-0 h-1.5" :class="topBar"></span>
    <h3 class="mt-1 font-display text-xl font-semibold text-ink group-hover:text-teal-700">
      <NuxtLink :to="to" class="after:absolute after:inset-0">{{ offer.title }}</NuxtLink>
    </h3>
    <p class="mt-2 flex-1 text-sm leading-relaxed text-ink/65">
      <AccentText :text="offer.shortDescription" />
    </p>

    <dl class="mt-4 space-y-1.5 text-sm">
      <div v-if="offer.durationLabel" class="flex gap-2">
        <dt class="text-ink/45">Durée</dt>
        <dd class="font-medium text-ink/80">{{ offer.durationLabel }}</dd>
      </div>
      <div v-if="offer.priceLabel" class="flex gap-2">
        <dt class="text-ink/45">Tarif</dt>
        <dd class="font-medium text-ink/80">{{ offer.priceLabel }}</dd>
      </div>
    </dl>

    <span class="mt-5 inline-flex items-center gap-1 text-sm font-semibold" :class="accent">
      En savoir plus
      <span aria-hidden="true" class="transition-transform group-hover:translate-x-0.5">→</span>
    </span>
  </article>
</template>
