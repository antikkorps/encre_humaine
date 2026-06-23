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

// Pagination côté client (l'endpoint renvoie tous les articles publiés). Réinitialisée
// au changement de filtre. La grille n'affiche qu'une page ; navigation par numéros.
const PAGE_SIZE = 9;
const page = ref(1);
watch(activeGroup, () => {
  page.value = 1;
});
const pageCount = computed(() => Math.max(1, Math.ceil(visibleArticles.value.length / PAGE_SIZE)));
const pagedArticles = computed(() =>
  visibleArticles.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE),
);
function goToPage(n: number) {
  page.value = Math.min(Math.max(1, n), pageCount.value);
  if (import.meta.client) window.scrollTo({ top: 0, behavior: "smooth" });
}

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
    <PageHero
      :title="heading"
      eyebrow="Ressources"
      :body="content?.accrocheBody ?? undefined"
      variant="neutral"
    />

    <p
      v-if="error"
      class="mx-auto max-w-6xl px-4 py-16 text-center text-ink/70"
      role="status"
    >
      Le contenu est momentanément indisponible. Merci de réessayer dans un instant.
    </p>

    <template v-else-if="content">
      <!-- 2. Ressource gratuite en vedette -->
      <section v-if="content.featured" class="mx-auto max-w-5xl px-4 py-16">
        <article class="grid items-center gap-8 overflow-hidden rounded-3xl border border-ink/5 bg-white p-6 shadow-soft md:grid-cols-2 md:p-8">
          <img
            v-if="content.featured.coverUrl"
            :src="content.featured.coverUrl"
            :alt="content.featured.title"
            width="640"
            height="480"
            class="aspect-[4/3] w-full rounded-2xl object-cover"
          />
          <div>
            <p class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-accent">
              <span aria-hidden="true" class="h-px w-5 bg-orange-300"></span>
              Ressource gratuite
            </p>
            <h2 class="mt-2 font-display text-2xl font-bold text-ink">
              {{ content.featured.title }}
            </h2>
            <p v-if="content.featured.description" class="mt-3 leading-relaxed text-ink/65">
              {{ content.featured.description }}
            </p>

            <!-- Gating email → inscription newsletter ; sinon téléchargement direct -->
            <div v-if="content.featured.requiresEmail" class="mt-6">
              <p class="mb-3 text-sm text-ink/60">
                Recevez cette ressource en vous inscrivant à la newsletter :
              </p>
              <NewsletterForm />
            </div>
            <a
              v-else-if="content.featured.downloadUrl"
              :href="content.featured.downloadUrl"
              target="_blank"
              rel="noopener"
              class="mt-6 inline-flex items-center gap-1.5 rounded-full bg-teal-700 px-7 py-3 font-semibold text-white shadow-soft transition-colors hover:bg-teal-800"
            >
              Télécharger
              <span aria-hidden="true">↓</span>
            </a>
          </div>
        </article>
      </section>

      <!-- 3 + 4. Filtres + grille d'articles -->
      <section class="mx-auto max-w-6xl px-4 pb-24" :class="content.featured ? '' : 'pt-4'">
        <SectionHeading title="Articles" />

        <div v-if="content.filters.length" class="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filtrer par thème">
          <button
            type="button"
            class="rounded-full border px-4 py-1.5 text-sm font-medium transition-colors"
            :class="activeGroup === null
              ? 'border-teal-700 bg-teal-700 text-white shadow-soft'
              : 'border-ink/15 text-ink/70 hover:border-teal-300 hover:bg-teal-50'"
            :aria-pressed="activeGroup === null"
            @click="activeGroup = null"
          >
            Tout
          </button>
          <button
            v-for="filter in content.filters"
            :key="filter.group"
            type="button"
            class="rounded-full border px-4 py-1.5 text-sm font-medium transition-colors"
            :class="activeGroup === filter.group
              ? 'border-teal-700 bg-teal-700 text-white shadow-soft'
              : 'border-ink/15 text-ink/70 hover:border-teal-300 hover:bg-teal-50'"
            :aria-pressed="activeGroup === filter.group"
            @click="activeGroup = filter.group"
          >
            {{ filter.label }}
          </button>
        </div>

        <!-- État vide (0 article) : pas de section cassée -->
        <p
          v-if="!visibleArticles.length"
          class="mt-12 text-center text-ink/65"
          role="status"
        >
          Les premiers articles arrivent bientôt. En attendant, abonnez-vous à
          <NuxtLink to="/newsletter" class="text-teal-700 underline">la newsletter</NuxtLink>.
        </p>

        <div v-else class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <ArticleCard v-for="article in pagedArticles" :key="article.slug" :article="article" />
        </div>

        <!-- Pagination (masquée s'il n'y a qu'une page) -->
        <nav
          v-if="pageCount > 1"
          class="mt-12 flex items-center justify-center gap-2"
          aria-label="Pagination des articles"
        >
          <button
            type="button"
            class="inline-flex h-10 items-center rounded-full border border-ink/15 px-4 text-sm font-medium text-ink/70 transition-colors hover:border-teal-300 hover:bg-teal-50 disabled:opacity-40 disabled:hover:border-ink/15 disabled:hover:bg-transparent"
            :disabled="page === 1"
            @click="goToPage(page - 1)"
          >
            <span aria-hidden="true">←</span><span class="sr-only">Page précédente</span>
          </button>
          <button
            v-for="n in pageCount"
            :key="n"
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors"
            :class="n === page
              ? 'bg-teal-700 text-white shadow-soft'
              : 'border border-ink/15 text-ink/70 hover:border-teal-300 hover:bg-teal-50'"
            :aria-current="n === page ? 'page' : undefined"
            :aria-label="`Page ${n}`"
            @click="goToPage(n)"
          >
            {{ n }}
          </button>
          <button
            type="button"
            class="inline-flex h-10 items-center rounded-full border border-ink/15 px-4 text-sm font-medium text-ink/70 transition-colors hover:border-teal-300 hover:bg-teal-50 disabled:opacity-40 disabled:hover:border-ink/15 disabled:hover:bg-transparent"
            :disabled="page === pageCount"
            @click="goToPage(page + 1)"
          >
            <span aria-hidden="true">→</span><span class="sr-only">Page suivante</span>
          </button>
        </nav>
      </section>
    </template>
  </div>
</template>
