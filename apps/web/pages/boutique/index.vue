<script setup lang="ts">
// Catalogue boutique — docs/06-boutique.md. Réglages éditoriaux (titre/intro/
// activation) depuis `shop_page` ; produits via `/api/shop/products` (merge
// Directus published + Stripe actif, prix TOUJOURS depuis Stripe). Si la boutique
// n'est pas activée → page « bientôt » (pas de grille). Sinon états chargement
// (squelette) / vide (message éditorial) / erreur (sobre). Rendu ISR.
import type { ProductSummary } from "~/types/content";

const { data: shop } = await useShopPage();
const { data, status, error } = await useFetch("/api/shop/products");

const siteName = "L'Encre Humaine";
const title = computed(() => shop.value?.title ?? "La boutique");
const enabled = computed(() => shop.value?.enabled === true);

// Le catalogue ne renvoie que des produits achetables (published + prix actif) ;
// on dérive la carte présentationnelle (prix formaté depuis Stripe, 1er visuel).
const products = computed<ProductSummary[]>(() =>
  (data.value?.products ?? []).map((p) => ({
    name: p.name,
    slug: p.slug,
    tagline: p.tagline ?? undefined,
    image: p.images[0],
    imageAlt: p.name,
    priceLabel: formatPrice(p.unitAmount, p.currency),
    available: true,
  })),
);

useSeoMeta({
  title: () => `${title.value} — ${siteName}`,
  description: () => shop.value?.seo.description ?? shop.value?.intro ?? undefined,
  ogTitle: () => `${title.value} — ${siteName}`,
  ogType: "website",
  // Boutique fermée ou marquée no_index → non indexée.
  robots: () => (!enabled.value || shop.value?.seo.noIndex ? "noindex, nofollow" : undefined),
});
</script>

<template>
  <div>
    <!-- 1. En-tête éditorial -->
    <section class="bg-teal-50">
      <div class="mx-auto max-w-4xl px-4 py-16 text-center sm:py-20">
        <h1 class="font-display text-3xl font-bold text-teal-900 sm:text-4xl">{{ title }}</h1>
        <p v-if="shop?.intro" class="mx-auto mt-4 max-w-2xl text-teal-700">{{ shop.intro }}</p>
      </div>
    </section>

    <section class="mx-auto max-w-6xl px-4 py-16">
      <!-- Boutique non activée : message « bientôt » (pas de grille) -->
      <p
        v-if="!enabled"
        class="py-12 text-center text-teal-700"
        role="status"
      >
        {{ shop?.emptyMessage ?? "La boutique ouvrira bientôt ses portes. Revenez très vite !" }}
      </p>

      <!-- Chargement : squelette discret -->
      <div
        v-else-if="status === 'pending'"
        class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        aria-hidden="true"
      >
        <div
          v-for="i in 6"
          :key="i"
          class="h-80 animate-pulse rounded-2xl border border-teal-100 bg-teal-50"
        />
      </div>

      <!-- Erreur : message sobre -->
      <p
        v-else-if="error"
        class="py-12 text-center text-teal-700"
        role="status"
      >
        La boutique est momentanément indisponible. Merci de réessayer dans un instant.
      </p>

      <!-- Ouverte mais sans produit : message éditorial -->
      <p
        v-else-if="!products.length"
        class="py-12 text-center text-teal-700"
        role="status"
      >
        {{ shop?.emptyMessage ?? "Les premiers produits arrivent bientôt. Revenez vite !" }}
      </p>

      <!-- Grille produits -->
      <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ProductCard v-for="product in products" :key="product.slug" :product="product" />
      </div>
    </section>
  </div>
</template>
