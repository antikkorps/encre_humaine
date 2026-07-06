<script setup lang="ts">
// Page fusionnée « Les Tentacules » (blog + newsletter) — /ressources. Contenu depuis
// `resources_page` + articles publiés + `newsletter_page`, via l'endpoint caché
// `/api/content/resources`. Fonctionne avec 0 article (état vide propre). Filtres par
// groupe de catégorie (côté client). L'inscription passe par `NewsletterForm` (double
// opt-in) ; la landing `/newsletter` a été fusionnée ici (redirect 301).
const { data: content, error } = await useFetch("/api/content/resources", {
  query: usePreviewQuery(),
});

const siteName = "L'Encre Humaine";
const heading = computed(() => content.value?.accrocheTitle ?? "Ressources");

// Filtre par groupe de catégorie (null = tout).
const activeGroup = ref<string | null>(null);
const visibleArticles = computed(() => {
  const all = content.value?.articles ?? [];
  return activeGroup.value ? all.filter((a) => a.categoryGroup === activeGroup.value) : all;
});
// Mots-clés du filtre actif (chrome de taxonomie) — masqué sur « Tout ».
const activeKeywords = computed(
  () => content.value?.filters.find((f) => f.group === activeGroup.value)?.keywords ?? null,
);

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
  title: () => content.value?.seo.title ?? `Les Tentacules — ${siteName}`,
  description: () => content.value?.seo.description ?? undefined,
  ogTitle: () => content.value?.seo.title ?? `Les Tentacules — ${siteName}`,
  ogDescription: () => content.value?.seo.description ?? undefined,
  ogImage: () => content.value?.seo.ogImage ?? undefined,
  ogType: "website",
  robots: () => (content.value?.seo.noIndex ? "noindex, nofollow" : undefined),
});
</script>

<template>
  <div>
    <!-- 1. Hero (h1 + sous-titre + signature 🐙) -->
    <PageHero
      :title="heading"
      eyebrow="Les Tentacules"
      :body="content?.accrocheBody ?? undefined"
      variant="neutral"
    >
      <p
        v-if="content?.heroSignature"
        class="mx-auto mt-6 max-w-2xl whitespace-pre-line font-display text-lg font-medium text-teal-800"
      >
        {{ content.heroSignature }}
      </p>
    </PageHero>

    <p
      v-if="error"
      class="mx-auto max-w-6xl px-4 py-16 text-center text-ink/70"
      role="status"
    >
      Le contenu est momentanément indisponible. Merci de réessayer dans un instant.
    </p>

    <template v-else-if="content">
      <!-- 3. À lire en premier (article vedette) — masqué si non défini -->
      <section v-if="content.featuredArticle" v-reveal class="mx-auto max-w-5xl px-4 py-16">
        <SectionHeading title="À lire en premier" eyebrow="Sélection" />
        <NuxtLink
          :to="`/ressources/${content.featuredArticle.slug}`"
          class="mt-8 grid items-center gap-8 overflow-hidden rounded-3xl border border-ink/5 bg-white p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift md:grid-cols-2 md:p-8"
        >
          <NuxtImg
            v-if="content.featuredArticle.coverImage"
            :src="content.featuredArticle.coverImage"
            :alt="content.featuredArticle.coverAlt || content.featuredArticle.title"
            width="640"
            height="480"
            fit="cover"
            format="webp"
            sizes="100vw md:50vw lg:480px"
            loading="lazy"
            decoding="async"
            class="aspect-[4/3] w-full rounded-2xl object-cover"
          />
          <div>
            <p
              v-if="content.featuredArticle.categoryName"
              class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand-accent"
            >
              <span aria-hidden="true" class="h-px w-5 bg-orange-300"></span>
              {{ content.featuredArticle.categoryName }}
            </p>
            <h3 class="mt-2 font-display text-2xl font-bold text-ink">
              {{ content.featuredArticle.title }}
            </h3>
            <p v-if="content.featuredArticle.excerpt" class="mt-3 leading-relaxed text-ink/65">
              {{ content.featuredArticle.excerpt }}
            </p>
            <span class="mt-6 inline-flex items-center gap-1.5 font-semibold text-teal-700">
              Lire l'article <span aria-hidden="true">→</span>
            </span>
          </div>
        </NuxtLink>
      </section>

      <!-- 2 + 4. Explorer les Tentacules (filtres) + dernières publiées (grille) -->
      <section class="mx-auto max-w-6xl px-4 pb-24" :class="content.featuredArticle ? '' : 'pt-4'">
        <SectionHeading title="Dernières tentacules publiées" eyebrow="Explorer les Tentacules" />

        <div v-if="content.filters.length" class="mt-6" role="group" aria-label="Filtrer par thème">
          <div class="flex flex-wrap gap-2">
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
              <span aria-hidden="true">{{ filter.emoji }}</span> {{ filter.label }}
            </button>
          </div>
          <p v-if="activeKeywords" class="mt-3 text-sm text-ink/55">{{ activeKeywords }}</p>
        </div>

        <!-- État vide (0 article) : pas de section cassée -->
        <p
          v-if="!visibleArticles.length"
          class="mt-12 text-center text-ink/65"
          role="status"
        >
          Les premières tentacules arrivent bientôt. En attendant, inscrivez-vous à
          <NuxtLink to="#newsletter" class="text-teal-700 underline">la newsletter</NuxtLink>.
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

      <!-- 5. Newsletter intégrée « Les Tentacules » -->
      <section id="newsletter" v-reveal class="scroll-mt-24 bg-teal-50">
        <div class="mx-auto max-w-5xl px-4 py-20">
          <SectionHeading
            :title="content.newsletter.name || 'Les Tentacules de L\'Encre Humaine'"
            :subtitle="content.newsletter.subtitle ?? undefined"
            eyebrow="🐙 Newsletter"
            align="center"
          />
          <div class="mt-10 grid gap-10 md:grid-cols-2">
            <div class="space-y-8">
              <div v-if="content.newsletter.helpsWith.length">
                <p class="font-display font-semibold text-ink">Chaque édition aide à :</p>
                <ul class="mt-3 space-y-2">
                  <li
                    v-for="(item, i) in content.newsletter.helpsWith"
                    :key="i"
                    class="flex items-start gap-2.5 text-ink/75"
                  >
                    <span class="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700" aria-hidden="true">✓</span>
                    <span>{{ item }}</span>
                  </li>
                </ul>
              </div>
              <div v-if="content.newsletter.whatYouReceive.length">
                <p class="font-display font-semibold text-ink">Dans chaque édition :</p>
                <ul class="mt-3 space-y-2">
                  <li
                    v-for="(item, i) in content.newsletter.whatYouReceive"
                    :key="i"
                    class="flex items-start gap-2.5 text-ink/75"
                  >
                    <span class="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700" aria-hidden="true">•</span>
                    <span>{{ item }}</span>
                  </li>
                </ul>
              </div>
            </div>
            <div class="rounded-3xl border border-ink/5 bg-white p-6 shadow-soft sm:p-8">
              <NewsletterForm submit-label="Recevoir les Tentacules" />
              <p
                v-if="content.newsletter.welcomeGiftLabel"
                class="mt-5 rounded-2xl bg-orange-50 px-4 py-3 text-sm text-ink/75"
              >
                <span aria-hidden="true">📘</span>
                <span class="font-semibold text-orange-700"> Offert à l'inscription : </span>
                {{ content.newsletter.welcomeGiftLabel }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- 6. Positionnement — masqué si vide -->
      <section v-if="content.positioning" v-reveal class="mx-auto max-w-3xl px-4 py-20">
        <SectionHeading :title="content.positioning.title || 'Une approche terrain'" />
        <RichText v-if="content.positioning.bodyHtml" :html="content.positioning.bodyHtml" class="mt-5" />
      </section>

      <!-- 7. CTA final → section newsletter -->
      <section v-reveal class="mx-auto max-w-6xl px-4 pb-24">
        <CtaBlock
          :title="content.ctaTitle || 'Commencer à y voir plus clair'"
          cta-label="S'inscrire aux prochaines Tentacules"
          to="#newsletter"
          variant="teal"
        />
      </section>
    </template>
  </div>
</template>
