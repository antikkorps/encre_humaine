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
  <article class="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-ink/5 bg-white shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift">
    <!-- NuxtImg → provider Directus (srcset + webp). width/height = CLS. -->
    <div v-if="article.coverImage" class="overflow-hidden">
      <NuxtImg
        :src="article.coverImage"
        :alt="article.coverAlt ?? ''"
        width="640"
        height="360"
        fit="cover"
        format="webp"
        sizes="100vw sm:50vw lg:400px"
        loading="lazy"
        decoding="async"
        class="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    </div>
    <div class="flex flex-1 flex-col p-6">
      <p
        v-if="article.categoryName"
        class="text-xs font-semibold uppercase tracking-[0.1em] text-brand-accent"
      >
        {{ article.categoryName }}
      </p>
      <h3 class="mt-1.5 font-display text-xl font-semibold text-ink group-hover:text-teal-700">
        <NuxtLink :to="to" class="after:absolute after:inset-0">{{ article.title }}</NuxtLink>
      </h3>
      <p v-if="article.excerpt" class="mt-2 flex-1 text-sm leading-relaxed text-ink/65">
        {{ article.excerpt }}
      </p>
      <p class="mt-4 flex items-center gap-2 text-xs text-ink/45">
        <time v-if="publishedLabel" :datetime="article.publishedAt">{{ publishedLabel }}</time>
        <span v-if="publishedLabel && article.readingTime" aria-hidden="true">·</span>
        <span v-if="article.readingTime">{{ article.readingTime }} min de lecture</span>
      </p>
    </div>
  </article>
</template>
