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
        innerHTML: serializeJsonLd({
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

  // Fil d'Ariane structuré (Accueil > Boutique > produit).
  useSchemaOrg([
    defineBreadcrumb({
      itemListElement: [
        { name: "Accueil", item: "/" },
        { name: "Boutique", item: "/boutique" },
        { name: p.name },
      ],
    }),
  ]);
}
</script>

<template>
  <div v-if="product" class="relative isolate mx-auto max-w-6xl overflow-x-clip px-4 py-12 sm:py-16">
    <!-- Filigrane tentacule (ADN encre) — discret, derrière la colonne infos. -->
    <TentacleAccent
      name="tentacule-1-trait"
      class="absolute -scale-x-100 -right-16 bottom-8 -z-10 hidden w-96 text-teal-600/[0.06] lg:block"
    />
    <nav class="mb-6 text-sm font-medium text-teal-700" aria-label="Fil d'Ariane">
      <NuxtLink to="/boutique" class="underline-offset-2 hover:underline">← Boutique</NuxtLink>
    </nav>

    <div class="grid gap-10 md:grid-cols-2">
      <!-- Galerie -->
      <div>
        <NuxtImg
          v-if="product.images.length"
          :src="product.images[activeImage]"
          :alt="product.name"
          width="800"
          height="600"
          fit="cover"
          format="webp"
          sizes="100vw md:50vw lg:560px"
          preload
          fetchpriority="high"
          class="aspect-[4/3] w-full rounded-3xl border border-ink/5 object-cover shadow-soft"
        />
        <div
          v-else
          class="flex aspect-[4/3] w-full items-center justify-center rounded-3xl border border-ink/5 bg-teal-50 text-teal-300"
          aria-hidden="true"
        >
          <OctopusLogo class="h-24 w-24" />
        </div>
        <ul v-if="product.images.length > 1" class="mt-3 flex flex-wrap gap-2">
          <li v-for="(img, i) in product.images" :key="img">
            <button
              type="button"
              class="overflow-hidden rounded-xl border-2 transition-colors"
              :class="i === activeImage ? 'border-teal-600' : 'border-transparent hover:border-teal-200'"
              :aria-label="`Voir le visuel ${i + 1}`"
              :aria-pressed="i === activeImage"
              @click="activeImage = i"
            >
              <NuxtImg :src="img" :alt="`${product.name} — visuel ${i + 1}`" width="72" height="72" fit="cover" format="webp" sizes="72px" class="h-16 w-16 object-cover" />
            </button>
          </li>
        </ul>
      </div>

      <!-- Infos + achat -->
      <div>
        <h1 class="font-display text-4xl font-bold text-ink">{{ product.name }}</h1>
        <p v-if="product.tagline" class="mt-3 text-lg leading-relaxed text-ink/70">{{ product.tagline }}</p>

        <p class="mt-5 font-display text-3xl font-bold text-teal-700">{{ priceLabel }}</p>
        <!-- Franchise en base de TVA (docs/06 §4, ADR #4) — près du prix. -->
        <p class="mt-1 text-xs text-ink/45">TVA non applicable, art. 293 B du CGI.</p>

        <!-- Achat direct -->
        <div class="mt-6 flex flex-wrap items-end gap-4">
          <div>
            <label for="qty" class="block text-sm text-ink/60">Quantité</label>
            <input
              id="qty"
              v-model.number="quantity"
              type="number"
              min="1"
              max="20"
              class="mt-1 w-20 rounded-xl border border-ink/15 bg-paper/40 px-3 py-2 text-ink transition-colors focus:border-teal-500 focus:bg-white"
            />
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full bg-teal-700 px-7 py-3 font-semibold text-white shadow-soft transition-colors hover:bg-teal-800 disabled:opacity-60"
            :disabled="buying"
            @click="buy"
          >
            {{ buying ? "Redirection…" : "Acheter" }}
            <span v-if="!buying" aria-hidden="true">→</span>
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
          class="mt-8 divide-y divide-ink/5 overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-soft"
        >
          <div
            v-for="(detail, i) in product.gameDetails"
            :key="i"
            class="flex justify-between gap-4 px-5 py-3 text-sm"
          >
            <dt class="text-ink/50">{{ detail.label }}</dt>
            <dd class="text-right font-medium text-ink">{{ detail.value }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </div>
</template>
