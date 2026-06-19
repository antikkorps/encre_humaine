<script setup lang="ts">
// Gabarit page légale — docs/10-legal.md. Mutualisé pour /mentions-legales, /cgv,
// /confidentialite, /cgu : les pages route fixent le `slug`. Contenu via l'endpoint
// caché `/api/content/legal/:slug` (body rich text assaini serveur, table des
// matières dérivée des h2). 404 si introuvable ; indisponibilité Directus → statut réel.
const props = defineProps<{ slug: string }>();

const { data: doc, error } = await useFetch(() => `/api/content/legal/${props.slug}`);

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 500,
    statusMessage: error.value.statusMessage || "Contenu momentanément indisponible",
    fatal: true,
  });
}
if (!doc.value) {
  throw createError({ statusCode: 404, statusMessage: "Document introuvable", fatal: true });
}

const siteName = "L'Encre Humaine";
const updatedLabel = computed(() => {
  const iso = doc.value?.updatedAt;
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
});
// Table des matières affichée pour les documents longs.
const showToc = computed(() => (doc.value?.toc.length ?? 0) >= 3);

useSeoMeta({
  title: () => `${doc.value?.title ?? "Mentions légales"} — ${siteName}`,
  description: () => doc.value?.seo.description ?? undefined,
  ogTitle: () => doc.value?.title ?? siteName,
  ogType: "website",
  robots: () => (doc.value?.seo.noIndex ? "noindex, nofollow" : undefined),
});
</script>

<template>
  <article v-if="doc" class="mx-auto max-w-3xl px-4 py-12 sm:py-16">
    <h1 class="font-display text-3xl font-bold text-teal-900 sm:text-4xl">{{ doc.title }}</h1>
    <p v-if="updatedLabel" class="mt-2 text-sm text-teal-500">
      Dernière mise à jour : {{ updatedLabel }}
    </p>

    <!-- Table des matières (docs longs) -->
    <nav v-if="showToc" class="mt-8 rounded-2xl border border-teal-100 bg-teal-50 p-5" aria-label="Sommaire">
      <p class="font-display font-semibold text-teal-800">Sommaire</p>
      <ol class="mt-3 space-y-1 text-sm">
        <li v-for="entry in doc.toc" :key="entry.id">
          <a :href="`#${entry.id}`" class="text-teal-700 underline-offset-2 hover:underline">
            {{ entry.text }}
          </a>
        </li>
      </ol>
    </nav>

    <RichText v-if="doc.html" :html="doc.html" class="mt-8" />
  </article>
</template>
