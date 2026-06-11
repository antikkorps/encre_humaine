<script setup lang="ts">
// Carte d'article de blog — docs/02-content-model.md §5 (`articles`),
// docs/07-ressources.md. Image de couverture optionnelle, `alt` obligatoire (a11y).
import type { ArticleSummary } from "~/types/content";

const props = defineProps<{ article: ArticleSummary }>();

const to = computed(() => `/ressources/${props.article.slug}`);

// Date FR lisible (ex. « 14 mars 2026 ») si fournie.
const publishedLabel = computed(() => {
  if (!props.article.publishedAt) return null;
  const d = new Date(props.article.publishedAt);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
});
</script>

<template>
  <article class="relative flex h-full flex-col overflow-hidden rounded-2xl border border-teal-100 bg-white transition-shadow hover:shadow-md">
    <!-- @nuxt/image + provider Directus = phase 1 ; <img> dimensionné pour limiter le CLS. -->
    <img
      v-if="article.coverImage"
      :src="article.coverImage"
      :alt="article.coverAlt ?? ''"
      width="640"
      height="360"
      loading="lazy"
      decoding="async"
      class="aspect-video w-full object-cover"
    />
    <div class="flex flex-1 flex-col p-5">
      <p
        v-if="article.categoryName"
        class="text-xs font-semibold uppercase tracking-wide text-brand-accent"
      >
        {{ article.categoryName }}
      </p>
      <h3 class="mt-1 font-display text-lg font-semibold text-teal-900">
        <NuxtLink :to="to" class="after:absolute after:inset-0">{{ article.title }}</NuxtLink>
      </h3>
      <p v-if="article.excerpt" class="mt-2 flex-1 text-sm text-teal-700">
        {{ article.excerpt }}
      </p>
      <p class="mt-3 flex items-center gap-2 text-xs text-teal-500">
        <time v-if="publishedLabel" :datetime="article.publishedAt">{{ publishedLabel }}</time>
        <span v-if="publishedLabel && article.readingTime" aria-hidden="true">·</span>
        <span v-if="article.readingTime">{{ article.readingTime }} min de lecture</span>
      </p>
    </div>
  </article>
</template>
