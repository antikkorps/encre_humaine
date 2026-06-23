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
  <div v-if="article" class="mx-auto max-w-6xl px-4 py-12 sm:py-16">
    <!-- Colonne principale centrée + aside sommaire à droite (groupe centré). -->
    <div class="lg:flex lg:justify-center lg:gap-12">
      <div class="w-full max-w-3xl">
        <nav class="mb-6 text-sm font-medium text-teal-700" aria-label="Fil d'Ariane">
          <NuxtLink to="/ressources" class="underline-offset-2 hover:underline">← Ressources</NuxtLink>
        </nav>

        <!-- 1. En-tête -->
        <article>
          <header>
          <p
            v-if="article.category"
            class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-accent"
          >
            <span aria-hidden="true" class="h-px w-5 bg-orange-300"></span>
            {{ article.category.name }}
          </p>
          <h1 class="mt-2 font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
            {{ article.title }}
          </h1>
          <p class="mt-4 flex items-center gap-2 text-sm text-ink/45">
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
            class="mt-8 aspect-video w-full rounded-3xl object-cover shadow-lift"
          />
        </header>

          <!-- 2. Corps (rich text assaini, h2 ancrés) -->
          <RichText v-if="article.bodyHtml" :html="article.bodyHtml" class="mt-10" />
        </article>

        <!-- 3. Encart newsletter — dans la colonne principale (aligné au corps) -->
        <div class="mt-14">
          <CtaBlock
            title="Envie d'aller plus loin ?"
            description="Recevez « Le Fil » : des outils concrets, sans bullshit, deux fois par mois."
            cta-label="S'abonner à la newsletter"
            to="/newsletter"
          />
        </div>
      </div>

      <!-- Sommaire fixe (navigation rapide) — desktop, masqué si pas de h2. -->
      <aside v-if="article.toc.length" class="hidden w-56 shrink-0 lg:block">
        <TableOfContents
          :items="article.toc"
          :reading-time="article.readingTime"
          class="sticky top-24"
        />
      </aside>
    </div>

    <!-- Sommaire flottant (mobile) — bouton bas-droite qui déplie les sections. -->
    <TableOfContents
      v-if="article.toc.length"
      :items="article.toc"
      :reading-time="article.readingTime"
      mobile
      class="lg:hidden"
    />

    <!-- 4. Articles liés -->
    <section v-if="article.related.length" class="mt-16">
      <SectionHeading title="À lire aussi" />
      <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ArticleCard v-for="rel in article.related" :key="rel.slug" :article="rel" />
      </div>
    </section>
  </div>
</template>
