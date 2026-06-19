<script setup lang="ts">
// Index Ressources (blog) — docs/07-ressources.md. Contenu depuis `resources_page`
// + articles publiés + ressource vedette, via l'endpoint caché `/api/content/resources`.
// Fonctionne avec 0 article (état vide propre). Filtres par groupe de catégorie
// (côté client). Ressource vedette : téléchargement direct OU gating newsletter.
const { data: content, error } = await useFetch("/api/content/resources");

const siteName = "L'Encre Humaine";
const heading = computed(() => content.value?.accrocheTitle ?? "Ressources");

// Filtre par groupe de catégorie (null = tout).
const activeGroup = ref<string | null>(null);
const visibleArticles = computed(() => {
  const all = content.value?.articles ?? [];
  return activeGroup.value ? all.filter((a) => a.categoryGroup === activeGroup.value) : all;
});

useSeoMeta({
  title: () => content.value?.seo.title ?? `Ressources — ${siteName}`,
  description: () => content.value?.seo.description ?? undefined,
  ogTitle: () => content.value?.seo.title ?? `Ressources — ${siteName}`,
  ogDescription: () => content.value?.seo.description ?? undefined,
  ogImage: () => content.value?.seo.ogImage ?? undefined,
  ogType: "website",
  robots: () => (content.value?.seo.noIndex ? "noindex, nofollow" : undefined),
});
</script>

<template>
  <div>
    <!-- 1. Accroche (h1) -->
    <section class="bg-teal-50">
      <div class="mx-auto max-w-3xl px-4 py-16 text-center sm:py-20">
        <h1 class="font-display text-3xl font-bold text-teal-900 sm:text-4xl">{{ heading }}</h1>
        <p
          v-if="content?.accrocheBody"
          class="mx-auto mt-4 max-w-2xl whitespace-pre-line text-teal-700"
        >
          {{ content.accrocheBody }}
        </p>
      </div>
    </section>

    <p
      v-if="error"
      class="mx-auto max-w-6xl px-4 py-16 text-center text-teal-700"
      role="status"
    >
      Le contenu est momentanément indisponible. Merci de réessayer dans un instant.
    </p>

    <template v-else-if="content">
      <!-- 2. Ressource gratuite en vedette -->
      <section v-if="content.featured" class="mx-auto max-w-5xl px-4 py-16">
        <article class="grid items-center gap-8 rounded-2xl border border-teal-100 bg-white p-6 md:grid-cols-2 md:p-8">
          <img
            v-if="content.featured.coverUrl"
            :src="content.featured.coverUrl"
            :alt="content.featured.title"
            width="640"
            height="480"
            class="aspect-[4/3] w-full rounded-xl object-cover"
          />
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-brand-accent">
              Ressource gratuite
            </p>
            <h2 class="mt-1 font-display text-2xl font-bold text-teal-900">
              {{ content.featured.title }}
            </h2>
            <p v-if="content.featured.description" class="mt-3 text-teal-700">
              {{ content.featured.description }}
            </p>

            <!-- Gating email → inscription newsletter ; sinon téléchargement direct -->
            <div v-if="content.featured.requiresEmail" class="mt-6">
              <p class="mb-3 text-sm text-teal-600">
                Recevez cette ressource en vous inscrivant à la newsletter :
              </p>
              <NewsletterForm />
            </div>
            <a
              v-else-if="content.featured.downloadUrl"
              :href="content.featured.downloadUrl"
              target="_blank"
              rel="noopener"
              class="mt-6 inline-flex items-center rounded-full bg-teal-700 px-6 py-3 font-medium text-white hover:bg-teal-800"
            >
              Télécharger
            </a>
          </div>
        </article>
      </section>

      <!-- 3 + 4. Filtres + grille d'articles -->
      <section class="mx-auto max-w-6xl px-4 pb-20">
        <SectionHeading title="Articles" />

        <div v-if="content.filters.length" class="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filtrer par thème">
          <button
            type="button"
            class="rounded-full border px-4 py-1.5 text-sm transition-colors"
            :class="activeGroup === null
              ? 'border-teal-700 bg-teal-700 text-white'
              : 'border-teal-200 text-teal-700 hover:bg-teal-50'"
            :aria-pressed="activeGroup === null"
            @click="activeGroup = null"
          >
            Tout
          </button>
          <button
            v-for="filter in content.filters"
            :key="filter.group"
            type="button"
            class="rounded-full border px-4 py-1.5 text-sm transition-colors"
            :class="activeGroup === filter.group
              ? 'border-teal-700 bg-teal-700 text-white'
              : 'border-teal-200 text-teal-700 hover:bg-teal-50'"
            :aria-pressed="activeGroup === filter.group"
            @click="activeGroup = filter.group"
          >
            {{ filter.label }}
          </button>
        </div>

        <!-- État vide (0 article) : pas de section cassée -->
        <p
          v-if="!visibleArticles.length"
          class="mt-10 text-center text-teal-700"
          role="status"
        >
          Les premiers articles arrivent bientôt. En attendant, abonnez-vous à
          <NuxtLink to="/newsletter" class="underline">la newsletter</NuxtLink>.
        </p>

        <div v-else class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <ArticleCard v-for="article in visibleArticles" :key="article.slug" :article="article" />
        </div>
      </section>
    </template>
  </div>
</template>
