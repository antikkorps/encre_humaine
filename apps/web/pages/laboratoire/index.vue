<script setup lang="ts">
// « Le Laboratoire » (/laboratoire, ex-boutique) — docs/06-boutique.md.
//
// Page VITRINE de ce qui se prépare : familles d'outils, chantier en cours,
// parti pris du jeu, invitation à la newsletter. Tout le contenu vient de
// `shop_page` (Directus) et chaque section se masque si elle est vide. Le
// catalogue produits et le paiement ne s'affichent QUE si Eléonore a ouvert la
// vente (`shop_enabled`) — le reste de la page vit indépendamment.

// Illustration signée Éléonore (l'établi du Labo) : asset local → import Vite,
// comme le poulpe stagiaire de la 404. Elle sert de REPLI au champ Directus
// `hero_image` : si Eléonore en dépose une dans le CMS, c'est la sienne qui prime.
import laboIllustration from "~/assets/labo/Labo.webp";
import type { ProductSummary } from "~/types/content";

const { data: shop } = await useShopPage();
const { data, error } = await useFetch("/api/shop/products");

const siteName = "L'Encre Humaine";
const title = computed(() => shop.value?.title ?? "Le Laboratoire");
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

// Visuels servis ENTIERS (illustrations, photos de carnet…) : largeur plafonnée,
// hauteur déduite du ratio natif → aucun rognage, place réservée (zéro CLS).
const imageSize = (photo: { width: number | null; height: number | null }, width: number) => {
  const ratio = photo.width && photo.height ? photo.height / photo.width : 0.75;
  return { width, height: Math.round(width * ratio) };
};

// Le champ « Titre SEO » de Directus fait FOI quand il est renseigné (comme sur
// toutes les autres pages) : Éléonore maîtrise alors le titre d'onglet en entier,
// ponctuation comprise. Sans lui, on retombe sur le gabarit « Titre — Marque ».
useSeoMeta({
  title: () => shop.value?.seo.title ?? `${title.value} — ${siteName}`,
  description: () => shop.value?.seo.description ?? shop.value?.intro ?? undefined,
  ogTitle: () => shop.value?.seo.title ?? `${title.value} — ${siteName}`,
  ogType: "website",
  robots: () => (shop.value?.seo.noIndex ? "noindex, nofollow" : undefined),
});
</script>

<template>
  <div>
    <!-- 1. Accroche : discours à gauche, illustration à droite -->
    <PageHero
      :title="title"
      :body="shop?.intro ?? undefined"
      variant="neutral"
      tentacle-side="left"
    >
      <RichText v-if="shop?.heroBodyHtml" :html="shop.heroBodyHtml" class="mt-6 max-w-xl" />
      <template #aside>
        <NuxtImg
          v-if="shop?.heroImage"
          :src="shop.heroImage.url"
          :alt="shop.heroImage.alt"
          :width="imageSize(shop.heroImage, 720).width"
          :height="imageSize(shop.heroImage, 720).height"
          fit="inside"
          format="webp"
          sizes="100vw lg:560px"
          loading="eager"
          decoding="async"
          class="h-auto w-full"
        />
        <img
          v-else
          :src="laboIllustration"
          alt="Illustration : un poulpe à son établi entouré de carnets, prototypes et jeux de cartes, sous une affiche « Le Labo — explorer, comprendre, concevoir, expérimenter » — signée Éléonore."
          width="1600"
          height="1214"
          decoding="async"
          fetchpriority="high"
          class="mx-auto w-full max-w-lg select-none lg:max-w-none"
        />
      </template>
    </PageHero>

    <!-- 2. Ce que vous trouverez bientôt — familles d'outils -->
    <section v-if="shop?.catalog" v-reveal class="relative isolate overflow-hidden bg-paper-2">
      <TentacleAccent
        side="right"
        name="tentacule-1-trait"
        class="absolute -right-16 -top-10 -z-10 hidden w-[26rem] rotate-12 text-teal-700/[0.06] lg:block"
      />
      <div class="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading
          :title="shop.catalog.title || 'Ce que vous trouverez bientôt'"
          eyebrow="Le Laboratoire"
          align="center"
        />
        <ul class="mt-12 flex flex-wrap justify-center gap-6">
          <li
            v-for="(item, i) in shop.catalog.items"
            :key="i"
            class="flex w-full flex-col rounded-3xl border border-ink/5 bg-paper p-7 shadow-soft sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)]"
          >
            <span
              class="grid h-14 w-14 place-items-center rounded-full bg-sand-400/15 text-sand-500 ring-1 ring-inset ring-sand-400/40"
              aria-hidden="true"
            >
              <Icon :name="`material-symbols:${item.icon || 'science'}`" class="h-7 w-7" />
            </span>
            <h3 v-if="item.title" class="mt-5 font-display text-lg font-semibold text-ink">
              <AccentText :text="item.title" />
            </h3>
            <p
              v-if="item.body"
              class="mt-2 whitespace-pre-line text-left leading-relaxed text-ink/65"
            >
              <AccentText :text="item.body" />
            </p>
            <!-- Statut poussé en bas → aligné d'une carte à l'autre. -->
            <p
              v-if="item.status"
              class="mt-auto flex items-center gap-2 pt-6 text-sm font-medium text-brand-accent"
            >
              <Icon name="material-symbols:hourglass-top" class="h-4 w-4" aria-hidden="true" />
              {{ item.status }}
            </p>
          </li>
        </ul>
      </div>
    </section>

    <!-- 2bis. Catalogue — vente ouverte ET quelque chose à montrer.
         Un catalogue ouvert mais vide n'affichait qu'un « revenez bientôt » sous
         un titre « Disponible maintenant » : section sans contenu, retirée à la
         demande d'Éléonore (2026-08-06). Elle revient d'elle-même dès qu'un
         produit est achetable — aucun réglage à penser. -->
    <section v-if="enabled && (products.length || error)" v-reveal class="relative isolate overflow-hidden">
      <TentacleAccent
        side="left"
        name="tentacule-4-plein"
        class="absolute -left-24 top-10 -z-10 hidden w-[28rem] -rotate-6 text-teal-600/[0.05] lg:block"
      />
      <div class="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading title="Disponible maintenant" eyebrow="Le catalogue" />

        <!-- Erreur : message sobre -->
        <p v-if="error" class="mt-10 text-center text-ink/65" role="status">
          Le catalogue est momentanément indisponible. Merci de réessayer dans un instant.
        </p>

        <div v-else class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <ProductCard v-for="product in products" :key="product.slug" :product="product" />
        </div>
      </div>
    </section>

    <!-- 3. En ce moment… — visuel à gauche, chantier en cours à droite -->
    <section v-if="shop?.focus" v-reveal class="relative isolate overflow-hidden">
      <TentacleAccent
        side="left"
        name="tentacule-2-trait"
        class="absolute -left-16 bottom-0 -z-10 hidden w-[32rem] rotate-6 text-teal-700/[0.06] lg:block"
      />
      <div class="mx-auto max-w-6xl px-4 py-20">
        <div
          class="grid items-center gap-10 lg:gap-14"
          :class="shop.focus.image ? 'md:grid-cols-[0.9fr_1.1fr]' : ''"
        >
          <NuxtImg
            v-if="shop.focus.image"
            :src="shop.focus.image.url"
            :alt="shop.focus.image.alt"
            :width="imageSize(shop.focus.image, 640).width"
            :height="imageSize(shop.focus.image, 640).height"
            fit="inside"
            format="webp"
            sizes="100vw md:480px"
            loading="lazy"
            decoding="async"
            class="h-auto w-full rounded-3xl shadow-lift"
          />
          <div :class="shop.focus.image ? '' : 'max-w-3xl'">
            <SectionHeading
              :title="shop.focus.title || 'En ce moment'"
              :eyebrow="shop.focus.eyebrow ?? undefined"
            />
            <RichText v-if="shop.focus.bodyHtml" :html="shop.focus.bodyHtml" class="mt-5" />
            <NuxtLink
              v-if="shop.focus.ctaLabel && shop.focus.ctaUrl"
              :to="shop.focus.ctaUrl"
              :external="true"
              target="_blank"
              rel="noopener"
              class="mt-8 inline-flex items-center gap-2 rounded-full bg-orange-400 px-7 py-3.5 font-semibold text-ink shadow-soft transition-transform hover:-translate-y-0.5"
            >
              {{ shop.focus.ctaLabel }}
              <Icon name="material-symbols:arrow-forward" class="h-5 w-5" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. Le parti pris du jeu — bandeau éditorial, visuel à droite -->
    <section v-if="shop?.manifesto" v-reveal class="mx-auto max-w-6xl px-4 py-10">
      <div
        class="relative isolate overflow-hidden rounded-3xl bg-paper-2 p-8 shadow-soft sm:p-12"
      >
        <TentacleAccent
          side="right"
          name="tentacule-3-trait"
          class="absolute -right-16 -top-12 -z-10 hidden w-[26rem] text-teal-700/[0.06] lg:block"
        />
        <div
          class="grid items-center gap-10"
          :class="shop.manifesto.image ? 'md:grid-cols-[1.1fr_0.9fr]' : ''"
        >
          <div>
            <h2 class="font-display text-2xl font-bold text-ink sm:text-3xl">
              <AccentText :text="shop.manifesto.title" />
            </h2>
            <p
              v-if="shop.manifesto.subtitle"
              class="mt-3 text-left font-display text-lg font-semibold text-brand-accent"
            >
              <AccentText :text="shop.manifesto.subtitle" />
            </p>
            <RichText v-if="shop.manifesto.bodyHtml" :html="shop.manifesto.bodyHtml" class="mt-5" />
          </div>
          <NuxtImg
            v-if="shop.manifesto.image"
            :src="shop.manifesto.image.url"
            :alt="shop.manifesto.image.alt"
            :width="imageSize(shop.manifesto.image, 640).width"
            :height="imageSize(shop.manifesto.image, 640).height"
            fit="inside"
            format="webp"
            sizes="100vw md:420px"
            loading="lazy"
            decoding="async"
            class="h-auto w-full rounded-2xl"
          />
        </div>
      </div>
    </section>

    <!-- 5. Pourquoi ce Laboratoire ? — optionnel (masqué tant qu'il est vide) -->
    <section v-if="shop?.why" v-reveal class="relative isolate overflow-hidden">
      <TentacleAccent
        side="right"
        name="tentacule-5-plein"
        class="absolute -right-24 bottom-4 -z-10 hidden w-[26rem] text-teal-600/[0.05] lg:block"
      />
      <div class="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading
          :title="shop.why.title || 'Pourquoi ce Laboratoire ?'"
          eyebrow="Le parti pris"
          align="center"
        />
        <ul class="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-10">
          <li
            v-for="(item, i) in shop.why.items"
            :key="i"
            class="w-full text-center sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)]"
          >
            <span
              class="mx-auto grid h-12 w-12 place-items-center rounded-full text-sand-500 ring-1 ring-inset ring-sand-400/40"
              aria-hidden="true"
            >
              <Icon :name="`material-symbols:${item.icon || 'check-circle'}`" class="h-6 w-6" />
            </span>
            <h3 v-if="item.title" class="mt-4 font-display text-lg font-semibold text-ink">
              <AccentText :text="item.title" />
            </h3>
            <p v-if="item.body" class="mt-2 text-center leading-relaxed text-ink/65">
              <AccentText :text="item.body" />
            </p>
          </li>
        </ul>
      </div>
    </section>

    <!-- 6. Invitation newsletter : le bloc CTA porte le formulaire d'inscription -->
    <section v-reveal class="mx-auto max-w-6xl px-4 py-20">
      <CtaBlock
        :title="shop?.newsletter.title || 'Vous souhaitez être informé des prochaines sorties ?'"
        :description="shop?.newsletter.body ?? undefined"
        eyebrow="Les Tentacules de L'Encre Humaine"
        layout="split"
      >
        <div class="rounded-3xl bg-white/95 p-6 text-left shadow-lift">
          <NewsletterForm submit-label="Recevoir les Tentacules" />
        </div>
      </CtaBlock>
    </section>
  </div>
</template>
