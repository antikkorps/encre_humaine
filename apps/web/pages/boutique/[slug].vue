<script setup lang="ts">
// Fiche produit — docs/06-boutique.md. Éditorial Directus (published, description
// assainie serveur) + prix Stripe, via `/api/shop/products/:slug`. Achat direct :
// crée une Checkout Session (hébergée Stripe) et redirige. 404 si produit
// dépublié/inexistant ou sans prix actif ; indisponibilité Directus → statut réel.
const route = useRoute();

// Boutique non activée (shop_page) → fiche inaccessible.
const { data: shop } = await useShopPage();
if (!shop.value?.enabled) {
  throw createError({ statusCode: 404, statusMessage: "Boutique indisponible", fatal: true });
}

const { data: product, error } = await useFetch(() => `/api/shop/products/${route.params.slug}`);

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 500,
    statusMessage: error.value.statusMessage || "Contenu momentanément indisponible",
    fatal: true,
  });
}
if (!product.value) {
  throw createError({ statusCode: 404, statusMessage: "Produit introuvable", fatal: true });
}

const siteName = "L'Encre Humaine";
const priceLabel = computed(() =>
  product.value ? formatPrice(product.value.unitAmount, product.value.currency) : "",
);

// Galerie : visuel principal sélectionnable au clavier (boutons) ; pas de lightbox (phase 2).
const activeImage = ref(0);

// Achat direct (panier minimal mono-produit, docs/05 §3). Aucun prix transporté.
const quantity = ref(1);
const buying = ref(false);
const buyError = ref(false);

async function buy() {
  if (!product.value) return;
  buying.value = true;
  buyError.value = false;
  try {
    const { url } = await $fetch("/api/shop/checkout", {
      method: "POST",
      body: { items: [{ priceId: product.value.priceId, quantity: quantity.value }] },
    });
    await navigateTo(url, { external: true });
  } catch {
    buyError.value = true;
    buying.value = false;
  }
}

useSeoMeta({
  title: () => `${product.value?.name ?? "Produit"} — ${siteName}`,
  description: () => product.value?.seo.description ?? product.value?.tagline ?? undefined,
  ogTitle: () => product.value?.name ?? siteName,
  ogDescription: () => product.value?.seo.description ?? product.value?.tagline ?? undefined,
  ogImage: () => product.value?.images[0] ?? product.value?.seo.ogImage ?? undefined,
  ogType: "website",
  robots: () => (product.value?.seo.noIndex ? "noindex, nofollow" : undefined),
});

// Données structurées Product (docs/06 §SEO) : prix/dispo issus de Stripe.
if (product.value) {
  const p = product.value;
  useHead({
    script: [
      {
        type: "application/ld+json",
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          ...(p.images.length ? { image: p.images } : {}),
          ...(p.tagline ? { description: p.tagline } : {}),
          offers: {
            "@type": "Offer",
            price: (p.unitAmount / 100).toFixed(2),
            priceCurrency: p.currency.toUpperCase(),
            availability: "https://schema.org/InStock",
          },
        }),
      },
    ],
  });
}
</script>

<template>
  <div v-if="product" class="mx-auto max-w-6xl px-4 py-12 sm:py-16">
    <nav class="mb-6 text-sm text-teal-600" aria-label="Fil d'Ariane">
      <NuxtLink to="/boutique" class="underline-offset-2 hover:underline">Boutique</NuxtLink>
    </nav>

    <div class="grid gap-10 md:grid-cols-2">
      <!-- Galerie -->
      <div>
        <img
          v-if="product.images.length"
          :src="product.images[activeImage]"
          :alt="product.name"
          width="800"
          height="600"
          class="aspect-[4/3] w-full rounded-2xl border border-teal-100 object-cover"
        />
        <div
          v-else
          class="flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-teal-400"
          aria-hidden="true"
        >
          🐙
        </div>
        <ul v-if="product.images.length > 1" class="mt-3 flex flex-wrap gap-2">
          <li v-for="(img, i) in product.images" :key="img">
            <button
              type="button"
              class="overflow-hidden rounded-lg border-2"
              :class="i === activeImage ? 'border-teal-600' : 'border-transparent'"
              :aria-label="`Voir le visuel ${i + 1}`"
              :aria-pressed="i === activeImage"
              @click="activeImage = i"
            >
              <img :src="img" :alt="`${product.name} — visuel ${i + 1}`" width="72" height="72" class="h-16 w-16 object-cover" />
            </button>
          </li>
        </ul>
      </div>

      <!-- Infos + achat -->
      <div>
        <h1 class="font-display text-3xl font-bold text-teal-900">{{ product.name }}</h1>
        <p v-if="product.tagline" class="mt-2 text-lg text-teal-700">{{ product.tagline }}</p>

        <p class="mt-4 font-display text-2xl font-bold text-teal-900">{{ priceLabel }}</p>
        <!-- Franchise en base de TVA (docs/06 §4, ADR #4) — près du prix. -->
        <p class="mt-1 text-xs text-teal-500">TVA non applicable, art. 293 B du CGI.</p>

        <!-- Achat direct -->
        <div class="mt-6 flex flex-wrap items-end gap-4">
          <div>
            <label for="qty" class="block text-sm text-teal-600">Quantité</label>
            <input
              id="qty"
              v-model.number="quantity"
              type="number"
              min="1"
              max="20"
              class="mt-1 w-20 rounded-lg border border-teal-200 px-3 py-2 text-teal-900"
            />
          </div>
          <button
            type="button"
            class="inline-flex items-center rounded-full bg-teal-700 px-6 py-3 font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-60"
            :disabled="buying"
            @click="buy"
          >
            {{ buying ? "Redirection…" : "Acheter" }}
          </button>
        </div>
        <p v-if="buyError" class="mt-3 text-sm text-orange-700" role="alert">
          Le paiement n'a pas pu démarrer. Merci de réessayer dans un instant.
        </p>

        <!-- Description (rich text assaini) -->
        <RichText v-if="product.descriptionHtml" :html="product.descriptionHtml" class="mt-8" />

        <!-- Caractéristiques du jeu -->
        <dl
          v-if="product.gameDetails.length"
          class="mt-8 divide-y divide-teal-100 rounded-2xl border border-teal-100"
        >
          <div
            v-for="(detail, i) in product.gameDetails"
            :key="i"
            class="flex justify-between gap-4 px-5 py-3 text-sm"
          >
            <dt class="text-teal-500">{{ detail.label }}</dt>
            <dd class="text-right font-medium text-teal-900">{{ detail.value }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>
