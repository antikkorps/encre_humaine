<script setup lang="ts">
// Carte produit (boutique) — docs/02-content-model.md §5 (`products`), docs/06-boutique.md.
// Éditorial depuis Directus ; le PRIX vient de Stripe (jamais de Directus). Si le prix
// est absent / le produit indisponible, on l'indique sans casser la carte.
import type { ProductSummary } from "~/types/content";

const props = defineProps<{ product: ProductSummary }>();

const to = computed(() => `/laboratoire/${props.product.slug}`);
const unavailable = computed(() => props.product.available === false);
</script>

<template>
  <article class="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-ink/5 bg-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift">
    <div class="relative overflow-hidden">
      <!-- NuxtImg → provider Directus (srcset + webp). width/height = CLS. -->
      <NuxtImg
        v-if="product.image"
        :src="product.image"
        :alt="product.imageAlt ?? product.name"
        width="640"
        height="480"
        fit="cover"
        format="webp"
        sizes="100vw sm:50vw lg:400px"
        loading="lazy"
        decoding="async"
        class="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <span
        v-if="unavailable"
        class="absolute right-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-xs font-medium text-paper"
      >
        Bientôt disponible
      </span>
    </div>
    <div class="flex flex-1 flex-col p-6">
      <h3 class="font-display text-lg font-semibold text-ink group-hover:text-teal-700">
        <NuxtLink :to="to" class="after:absolute after:inset-0">{{ product.name }}</NuxtLink>
      </h3>
      <p v-if="product.tagline" class="mt-1.5 flex-1 text-sm leading-relaxed text-ink/65">
        {{ product.tagline }}
      </p>
      <p class="mt-4 font-display text-lg font-bold text-teal-700">
        <span v-if="product.priceLabel">{{ product.priceLabel }}</span>
        <span v-else class="text-sm font-normal text-ink/45">Prix à venir</span>
      </p>
    </div>
  </article>
</template>
