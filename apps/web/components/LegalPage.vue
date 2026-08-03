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
  <div v-if="doc" class="relative isolate mx-auto max-w-6xl overflow-x-clip px-4 py-12 sm:py-16">
    <!-- Filigrane tentacule (ADN encre) — discret, derrière le corps. overflow-x-clip
         (et non overflow-hidden) pour ne pas casser le sticky du sommaire. -->
    <TentacleAccent
      side="left"
      name="tentacule-4-trait"
      class="absolute -left-20 top-24 -z-10 hidden w-72 text-teal-700/[0.05] lg:block"
    />
    <div class="lg:flex lg:justify-center lg:gap-12">
      <article class="w-full max-w-3xl">
        <p class="text-xs font-semibold uppercase tracking-[0.12em] text-brand-accent">Informations</p>
        <h1 class="mt-2 font-display text-4xl font-bold text-ink sm:text-5xl">{{ doc.title }}</h1>
        <p v-if="updatedLabel" class="mt-3 text-sm text-ink/45">
          Dernière mise à jour : {{ updatedLabel }}
        </p>

        <RichText v-if="doc.html" :html="doc.html" class="mt-10" />
      </article>

      <!-- Sommaire fixe (navigation rapide) — desktop, docs longs uniquement. -->
      <aside v-if="showToc" class="hidden w-56 shrink-0 lg:block">
        <TableOfContents :items="doc.toc" class="sticky top-24" />
      </aside>
    </div>

    <!-- Sommaire flottant (mobile) — bouton bas-droite qui déplie les sections. -->
    <TableOfContents v-if="showToc" :items="doc.toc" mobile class="lg:hidden" />
  </div>
</template>
