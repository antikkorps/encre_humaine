<script setup lang="ts">
// Carte produit (boutique) — docs/02-content-model.md §5 (`products`), docs/06-boutique.md.
// Éditorial depuis Directus ; le PRIX vient de Stripe (jamais de Directus). Si le prix
// est absent / le produit indisponible, on l'indique sans casser la carte.
import type { ProductSummary } from "~/types/content";

const props = defineProps<{ product: ProductSummary }>();

const to = computed(() => `/boutique/${props.product.slug}`);
const unavailable = computed(() => props.product.available === false);
</script>

<template>
  <article class="relative flex h-full flex-col overflow-hidden rounded-2xl border border-teal-100 bg-white transition-shadow hover:shadow-md">
    <div class="relative">
      <!-- @nuxt/image + provider Directus = phase 1 ; <img> dimensionné (CLS). -->
      <img
        v-if="product.image"
        :src="product.image"
        :alt="product.imageAlt ?? product.name"
        width="640"
        height="480"
        loading="lazy"
        decoding="async"
        class="aspect-[4/3] w-full object-cover"
      />
      <span
        v-if="unavailable"
        class="absolute right-3 top-3 rounded-full bg-teal-900/80 px-2.5 py-1 text-xs font-medium text-white"
      >
        Bientôt disponible
      </span>
    </div>
    <div class="flex flex-1 flex-col p-5">
      <h3 class="font-display text-lg font-semibold text-teal-900">
        <NuxtLink :to="to" class="after:absolute after:inset-0">{{ product.name }}</NuxtLink>
      </h3>
      <p v-if="product.tagline" class="mt-1 flex-1 text-sm text-teal-700">
        {{ product.tagline }}
      </p>
      <p class="mt-3 font-display text-base font-semibold text-teal-900">
        <span v-if="product.priceLabel">{{ product.priceLabel }}</span>
        <span v-else class="text-sm font-normal text-teal-500">Prix à venir</span>
      </p>
    </div>
  </article>
</template>
