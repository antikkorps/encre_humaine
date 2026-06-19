<script setup lang="ts">
// Gabarit page Offre (B2B & B2C) — docs/05-offres-gabarit.md. **Une seule
// implémentation** pour les 5 offres (DRY) : les pages route `/organisations/[slug]`
// et `/particuliers/[slug]` montent ce composant avec leur `audience`. Contenu via
// l'endpoint serveur caché `/api/content/offer/:slug` (rich text déjà assaini
// serveur). 404 si l'offre n'existe pas ou si son audience ne correspond pas à la
// route (un slug B2B sous /particuliers → 404). Accent teal (orga) / orange (partic).
import type { Audience } from "@encre/shared/validation";

const props = defineProps<{ audience: Audience }>();

const route = useRoute();
const { data: content, error } = await useFetch(() => `/api/content/offer/${route.params.slug}`);

// Indisponibilité (Directus injoignable, 5xx) : on propage le statut réel plutôt
// que de la masquer en 404 (panne transitoire ≠ offre inexistante).
if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 500,
    statusMessage: error.value.statusMessage || "Contenu momentanément indisponible",
    fatal: true,
  });
}
// L'offre doit exister ET cibler le public de la route (slugs uniques tous publics
// confondus ; la garde évite de servir une offre B2B sous /particuliers et inversement).
if (!content.value || content.value.audience !== props.audience) {
  throw createError({ statusCode: 404, statusMessage: "Offre introuvable", fatal: true });
}

const isB2c = computed(() => props.audience === "particulier");

const theme = computed(() =>
  isB2c.value
    ? { heroBg: "bg-orange-600", heroText: "text-orange-50", accent: "text-orange-600" }
    : { heroBg: "bg-teal-700", heroText: "text-teal-50", accent: "text-teal-700" },
);
const hub = computed(() =>
  isB2c.value
    ? { to: "/particuliers", label: "Pour les particuliers" }
    : { to: "/organisations", label: "Pour les organisations" },
);
const missionHeading = computed(() =>
  isB2c.value ? "Ce qu'on fait ensemble" : "Ce que comprend la mission",
);
const formatHeading = computed(() => (isB2c.value ? "Le format" : "Comment ça se passe"));

const siteName = "L'Encre Humaine";
const heading = computed(() => content.value?.accrocheTitle ?? content.value?.seo.title ?? "Offre");

useSeoMeta({
  title: () => content.value?.seo.title ?? `${heading.value} — ${siteName}`,
  description: () => content.value?.seo.description ?? undefined,
  ogTitle: () => content.value?.seo.title ?? heading.value,
  ogDescription: () => content.value?.seo.description ?? undefined,
  ogImage: () => content.value?.seo.ogImage ?? undefined,
  ogType: "website",
  robots: () => (content.value?.seo.noIndex ? "noindex, nofollow" : undefined),
});
</script>

<template>
  <div v-if="content">
    <!-- 1. Accroche (h1) + fil d'Ariane (hub → offre) -->
    <section :class="theme.heroBg" class="text-white">
      <div class="mx-auto max-w-4xl px-4 py-16 text-center sm:py-20">
        <nav class="mb-4 text-sm" :class="theme.heroText" aria-label="Fil d'Ariane">
          <NuxtLink :to="hub.to" class="underline-offset-2 hover:underline">
            {{ hub.label }}
          </NuxtLink>
        </nav>
        <h1 class="font-display text-3xl font-bold sm:text-4xl">{{ heading }}</h1>
        <p
          v-if="content.accrocheBody"
          class="mx-auto mt-4 max-w-2xl whitespace-pre-line"
          :class="theme.heroText"
        >
          {{ content.accrocheBody }}
        </p>
      </div>
    </section>

    <!-- 2. Ce que comprend la mission / Ce qu'on fait ensemble -->
    <section v-if="content.missionIncludes.length" class="mx-auto max-w-3xl px-4 py-16">
      <SectionHeading :title="missionHeading" />
      <ul class="mt-6 space-y-3">
        <li
          v-for="(item, i) in content.missionIncludes"
          :key="i"
          class="flex gap-3 text-teal-700"
        >
          <span class="mt-1" :class="theme.accent" aria-hidden="true">✓</span>
          <span>{{ item }}</span>
        </li>
      </ul>
    </section>

    <!-- 3. Comment ça se passe (B2B) / Le format (B2C) — rich text assaini -->
    <section v-if="content.formatBodyHtml" class="bg-teal-50">
      <div class="mx-auto max-w-3xl px-4 py-16">
        <SectionHeading :title="formatHeading" />
        <RichText :html="content.formatBodyHtml" class="mt-4" />
      </div>
    </section>

    <!-- 4. Ce que vous en retirez -->
    <section v-if="content.outcomes.length" class="mx-auto max-w-6xl px-4 py-16">
      <SectionHeading title="Ce que vous en retirez" align="center" />
      <ul class="mt-8 grid gap-6 sm:grid-cols-2">
        <li
          v-for="(outcome, i) in content.outcomes"
          :key="i"
          class="rounded-2xl border border-teal-100 bg-white p-6"
        >
          <h3 v-if="outcome.title" class="font-display text-lg font-semibold text-teal-900">
            {{ outcome.title }}
          </h3>
          <p v-if="outcome.body" class="mt-2 text-teal-700">{{ outcome.body }}</p>
        </li>
      </ul>
    </section>

    <!-- 5. Pour qui (et pas pour qui) -->
    <section v-if="content.audienceFit.length" class="bg-teal-50">
      <div class="mx-auto max-w-3xl px-4 py-16">
        <SectionHeading title="Pour qui ?" />
        <ul class="mt-6 space-y-3">
          <li
            v-for="(item, i) in content.audienceFit"
            :key="i"
            class="flex gap-3 text-teal-700"
          >
            <span class="mt-1" :class="theme.accent" aria-hidden="true">→</span>
            <span>{{ item }}</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- 6. Investissement — libellé libre + mention franchise en base (293 B) -->
    <section
      v-if="content.priceLabel || content.priceNote || content.durationLabel"
      class="mx-auto max-w-3xl px-4 py-16"
    >
      <SectionHeading title="Investissement" />
      <div class="mt-6 rounded-2xl border border-teal-100 bg-white p-6">
        <p v-if="content.durationLabel" class="text-sm text-teal-600">
          Durée : <span class="text-teal-800">{{ content.durationLabel }}</span>
        </p>
        <p
          v-if="content.priceLabel"
          class="mt-1 font-display text-2xl font-bold text-teal-900"
        >
          {{ content.priceLabel }}
        </p>
        <p v-if="content.priceNote" class="mt-2 text-teal-700">{{ content.priceNote }}</p>
        <!-- Franchise en base de TVA (docs/05 §6, ADR #4) — affichée près du prix. -->
        <p class="mt-3 text-xs text-teal-500">TVA non applicable, art. 293 B du CGI.</p>
      </div>
    </section>

    <!-- 7. FAQ (faq_items par scope) -->
    <section v-if="content.faq.length" class="bg-teal-50">
      <div class="mx-auto max-w-3xl px-4 py-16">
        <SectionHeading title="Questions fréquentes" align="center" />
        <div class="mt-8">
          <FaqAccordion :items="content.faq" />
        </div>
      </div>
    </section>

    <!-- 8. Témoignage — masqué si vide -->
    <section
      v-if="content.testimonial"
      class="mx-auto max-w-3xl px-4 py-16"
      aria-label="Témoignage"
    >
      <TestimonialCard :testimonial="content.testimonial" />
    </section>

    <!-- 9. CTA → contact -->
    <section class="mx-auto max-w-6xl px-4 py-16">
      <CtaBlock
        title="Travaillons ensemble"
        :cta-label="content.ctaLabel"
        to="/contact"
        :variant="isB2c ? 'orange' : 'teal'"
      />
    </section>
  </div>
</template>
