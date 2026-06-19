<script setup lang="ts">
// Article de blog — docs/07-ressources.md. Contenu depuis `articles` (par slug)
// via l'endpoint caché `/api/content/article/:slug` (body rich text assaini
// serveur). 404 si introuvable ; indisponibilité Directus → statut réel. Encart
// newsletter en fin d'article + articles liés (même catégorie).
const route = useRoute();
const { data: article, error } = await useFetch(() => `/api/content/article/${route.params.slug}`);

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 500,
    statusMessage: error.value.statusMessage || "Contenu momentanément indisponible",
    fatal: true,
  });
}
if (!article.value) {
  throw createError({ statusCode: 404, statusMessage: "Article introuvable", fatal: true });
}

const siteName = "L'Encre Humaine";
const publishedLabel = computed(() => {
  const iso = article.value?.publishedAt;
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
});

useSeoMeta({
  title: () => `${article.value?.title ?? "Article"} — ${siteName}`,
  description: () => article.value?.seo.description ?? article.value?.excerpt ?? undefined,
  ogTitle: () => article.value?.title ?? siteName,
  ogDescription: () => article.value?.seo.description ?? article.value?.excerpt ?? undefined,
  ogImage: () => article.value?.cover?.url ?? article.value?.seo.ogImage ?? undefined,
  ogType: "article",
  robots: () => (article.value?.seo.noIndex ? "noindex, nofollow" : undefined),
});

// Données structurées Article (docs/07 §SEO) : auteur = Eléonore.
if (article.value) {
  const a = article.value;
  useHead({
    script: [
      {
        type: "application/ld+json",
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: a.title,
          ...(a.excerpt ? { description: a.excerpt } : {}),
          ...(a.cover ? { image: [a.cover.url] } : {}),
          ...(a.publishedAt ? { datePublished: a.publishedAt } : {}),
          author: { "@type": "Person", name: "Eléonore Morée" },
          publisher: { "@type": "Organization", name: siteName },
        }),
      },
    ],
  });
}
</script>

<template>
  <article v-if="article" class="mx-auto max-w-3xl px-4 py-12 sm:py-16">
    <nav class="mb-6 text-sm text-teal-600" aria-label="Fil d'Ariane">
      <NuxtLink to="/ressources" class="underline-offset-2 hover:underline">Ressources</NuxtLink>
    </nav>

    <!-- 1. En-tête -->
    <header>
      <p
        v-if="article.category"
        class="text-xs font-semibold uppercase tracking-wide text-brand-accent"
      >
        {{ article.category.name }}
      </p>
      <h1 class="mt-1 font-display text-3xl font-bold text-teal-900 sm:text-4xl">
        {{ article.title }}
      </h1>
      <p class="mt-3 flex items-center gap-2 text-sm text-teal-500">
        <time v-if="publishedLabel" :datetime="article.publishedAt ?? undefined">
          {{ publishedLabel }}
        </time>
        <span v-if="publishedLabel && article.readingTime" aria-hidden="true">·</span>
        <span v-if="article.readingTime">{{ article.readingTime }} min de lecture</span>
      </p>
      <img
        v-if="article.cover"
        :src="article.cover.url"
        :alt="article.cover.alt"
        width="768"
        height="432"
        class="mt-6 aspect-video w-full rounded-2xl object-cover"
      />
    </header>

    <!-- 2. Corps (rich text assaini) -->
    <RichText v-if="article.bodyHtml" :html="article.bodyHtml" class="mt-8" />

    <!-- 3. Encart newsletter -->
    <div class="mt-12">
      <CtaBlock
        title="Envie d'aller plus loin ?"
        description="Recevez « Le Fil » : des outils concrets, sans bullshit, deux fois par mois."
        cta-label="S'abonner à la newsletter"
        to="/newsletter"
      />
    </div>

    <!-- 4. Articles liés -->
    <section v-if="article.related.length" class="mt-16">
      <SectionHeading title="À lire aussi" />
      <div class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ArticleCard v-for="rel in article.related" :key="rel.slug" :article="rel" />
      </div>
    </section>
  </article>
</template>
