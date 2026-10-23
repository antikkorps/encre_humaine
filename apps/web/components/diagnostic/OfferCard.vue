<script setup lang="ts">
// Carte d'offre recommandée par un diagnostic : nom, prix et durée, une phrase,
// lien « Voir des exemples concrets » vers la page de l'offre (cahier des charges §5.2).
import type { OfferTexts } from "@encre/shared/diagnostics";

defineProps<{ offer: OfferTexts; eyebrow?: string; linkLabel: string }>();
</script>

<template>
  <article class="rounded-3xl border border-ink/5 bg-white p-6 shadow-soft">
    <p v-if="eyebrow" class="text-xs font-bold uppercase tracking-[0.14em] text-orange-600">{{ eyebrow }}</p>
    <h4 class="mt-1 font-display text-xl font-bold text-ink">{{ offer.name }}</h4>
    <p class="mt-1 text-sm text-ink/60">{{ offer.price }}</p>
    <p class="mt-3 leading-relaxed text-ink/75">{{ offer.description }}</p>
    <NuxtLink
      :to="offer.url"
      :target="isExternalHref(offer.url) ? '_blank' : undefined"
      class="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-800"
    >
      {{ linkLabel }} <span aria-hidden="true">→</span>
    </NuxtLink>
  </article>
</template>
