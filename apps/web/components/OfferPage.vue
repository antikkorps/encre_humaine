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
const { data: content, error } = await useFetch(() => `/api/content/offer/${route.params.slug}`, {
  query: usePreviewQuery(),
});

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

const variant = computed<"teal" | "orange">(() => (isB2c.value ? "orange" : "teal"));
const theme = computed(() =>
  isB2c.value
    ? { accent: "text-orange-600", chip: "bg-orange-100 text-orange-700" }
    : { accent: "text-teal-700", chip: "bg-teal-100 text-teal-700" },
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

// Fil d'Ariane structuré (Accueil > hub d'audience > offre).
useSchemaOrg([
  defineBreadcrumb({
    itemListElement: [
      { name: "Accueil", item: "/" },
      { name: isB2c.value ? "Particuliers" : "Organisations", item: hub.value.to },
      { name: heading.value },
    ],
  }),
]);
</script>

<template>
  <div v-if="content">
    <!-- 1. Accroche (h1 + sous-titre) + fil d'Ariane (hub → offre) -->
    <PageHero
      :title="heading"
      :body="content.accrocheSubtitle || undefined"
      :variant="variant"
    >
      <template #top>
        <nav class="mb-4 text-sm font-medium" :class="theme.accent" aria-label="Fil d'Ariane">
          <NuxtLink :to="hub.to" class="underline-offset-2 hover:underline">
            ← {{ hub.label }}
          </NuxtLink>
        </nav>
      </template>
    </PageHero>

    <!-- Texte d'accroche + signature + CTA -->
    <section
      v-if="content.accrocheBody || content.accrocheSignature"
      v-reveal
      class="mx-auto max-w-3xl px-4 py-16 text-center"
    >
      <p v-if="content.accrocheBody" class="whitespace-pre-line text-lg leading-relaxed text-ink/75">
        {{ content.accrocheBody }}
      </p>
      <p
        v-if="content.accrocheSignature"
        class="mt-8 font-display text-2xl font-semibold"
        :class="theme.accent"
      >
        {{ content.accrocheSignature }}
      </p>
      <NuxtLink
        to="/contact"
        class="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 font-semibold text-paper shadow-soft transition-transform hover:-translate-y-0.5"
      >
        {{ content.ctaLabel }}
        <span aria-hidden="true">→</span>
      </NuxtLink>
    </section>

    <!-- 2. Ce que ça change (bénéfices) -->
    <section v-if="content.outcomes.length" v-reveal class="bg-teal-50">
      <div class="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading
          :title="content.outcomesTitle || 'Ce que vous en retirez'"
          :subtitle="content.outcomesIntro ?? undefined"
          align="center"
        />
        <ul class="mt-10 grid gap-6 sm:grid-cols-2">
          <li
            v-for="(outcome, i) in content.outcomes"
            :key="i"
            class="rounded-3xl border border-ink/5 bg-white p-7 shadow-soft"
          >
            <h3 v-if="outcome.title" class="font-display text-lg font-semibold text-ink">
              {{ outcome.title }}
            </h3>
            <p v-if="outcome.body" class="mt-2 leading-relaxed text-ink/65">{{ outcome.body }}</p>
          </li>
        </ul>
      </div>
    </section>

    <!-- 3. Ce que je vois souvent (contexte) -->
    <section v-if="content.context" v-reveal class="mx-auto max-w-6xl px-4 py-20">
      <SectionHeading :title="content.context.title || 'Ce que je vois souvent'" align="center" />
      <div v-if="content.context.items.length" class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="(item, i) in content.context.items"
          :key="i"
          class="rounded-3xl border border-ink/5 bg-white p-6 shadow-soft"
        >
          <h3 v-if="item.title" class="font-display text-base font-semibold text-ink">
            {{ item.title }}
          </h3>
          <p v-if="item.body" class="mt-1.5 text-sm leading-relaxed text-ink/65">{{ item.body }}</p>
        </article>
      </div>
      <p
        v-if="content.context.conclusion"
        class="mx-auto mt-10 max-w-2xl whitespace-pre-line text-center text-lg leading-relaxed text-ink/80"
      >
        {{ content.context.conclusion }}
      </p>
    </section>

    <!-- 3bis. Une approche qui relie (optionnel) — narratif + encadré signature -->
    <section v-if="content.approche" v-reveal class="mx-auto max-w-3xl px-4 py-20">
      <SectionHeading :title="content.approche.title || 'Mon approche'" />
      <RichText
        v-if="content.approche.bodyHtml"
        :html="content.approche.bodyHtml"
        class="mt-5"
      />
      <aside
        v-if="content.approche.signature"
        class="mt-8 rounded-3xl border-l-4 p-6 shadow-soft"
        :class="isB2c ? 'border-orange-300 bg-orange-50' : 'border-teal-400 bg-teal-50'"
      >
        <p class="whitespace-pre-line font-display text-lg leading-relaxed text-ink/85">
          {{ content.approche.signature }}
        </p>
      </aside>
    </section>

    <!-- 4. Ce que comprend la mission -->
    <section v-if="content.missionIncludes.length" v-reveal class="bg-paper-2">
      <div class="mx-auto max-w-3xl px-4 py-20">
        <SectionHeading
          :title="content.missionTitle || missionHeading"
          :subtitle="content.missionIntro ?? undefined"
        />
        <ul class="mt-8 space-y-5">
          <li
            v-for="(item, i) in content.missionIncludes"
            :key="i"
            class="flex items-start gap-3"
          >
            <span
              class="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full text-sm font-bold"
              :class="theme.chip"
              aria-hidden="true"
              >✓</span
            >
            <div>
              <p v-if="item.title" class="font-display font-semibold text-ink">{{ item.title }}</p>
              <p v-if="item.body" class="mt-0.5 leading-relaxed text-ink/65">{{ item.body }}</p>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- 4bis. Un regard / une expérience (optionnel) — narratif rich text -->
    <section v-if="content.background" v-reveal class="mx-auto max-w-3xl px-4 py-20">
      <SectionHeading :title="content.background.title || 'Mon expérience'" />
      <RichText
        v-if="content.background.bodyHtml"
        :html="content.background.bodyHtml"
        class="mt-5"
      />
    </section>

    <!-- 5. Comment ça se passe (optionnel) — rich text assaini -->
    <section v-if="content.formatBodyHtml" v-reveal class="mx-auto max-w-3xl px-4 py-20">
      <SectionHeading :title="content.formatTitle || formatHeading" />
      <RichText :html="content.formatBodyHtml" class="mt-5" />
    </section>

    <!-- 6. Pour qui (✓) + Pas pour vous (✗) -->
    <section
      v-if="content.audienceFit.length || content.audienceFitExclude.length || content.audienceFitConclusion"
      v-reveal
      class="bg-teal-50"
    >
      <div class="mx-auto max-w-3xl px-4 py-20">
        <SectionHeading :title="content.audienceFitTitle || 'Pour qui ?'" />
        <ul v-if="content.audienceFit.length" class="mt-8 space-y-3">
          <li
            v-for="(item, i) in content.audienceFit"
            :key="i"
            class="flex items-start gap-3 text-ink/80"
          >
            <span
              class="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full text-sm font-bold"
              :class="theme.chip"
              aria-hidden="true"
              >✓</span
            >
            <span>{{ item }}</span>
          </li>
        </ul>
        <template v-if="content.audienceFitExclude.length">
          <p class="mt-10 font-display font-semibold text-ink">
            Cet accompagnement n'est probablement pas adapté si…
          </p>
          <ul class="mt-4 space-y-3">
            <li
              v-for="(item, i) in content.audienceFitExclude"
              :key="i"
              class="flex items-start gap-3 text-ink/60"
            >
              <span
                class="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-ink/5 text-sm font-bold text-ink/50"
                aria-hidden="true"
                >✗</span
              >
              <span>{{ item }}</span>
            </li>
          </ul>
        </template>
        <p
          v-if="content.audienceFitConclusion"
          class="mt-8 whitespace-pre-line leading-relaxed text-ink/80"
        >
          {{ content.audienceFitConclusion }}
        </p>
      </div>
    </section>

    <!-- 6bis. Ce que vous emportez (livrables, ✓) — masqué si vide -->
    <section v-if="content.takeaways" v-reveal class="mx-auto max-w-3xl px-4 py-20">
      <SectionHeading
        :title="content.takeaways.title || 'Ce que vous emportez'"
        :subtitle="content.takeaways.intro ?? undefined"
      />
      <ul class="mt-8 space-y-3">
        <li
          v-for="(item, i) in content.takeaways.items"
          :key="i"
          class="flex items-start gap-3 text-ink/80"
        >
          <span
            class="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full text-sm font-bold"
            :class="theme.chip"
            aria-hidden="true"
            >✓</span
          >
          <span>{{ item }}</span>
        </li>
      </ul>
    </section>

    <!-- 7. Investissement — libellé libre + mention franchise en base (293 B) -->
    <section
      v-if="content.priceLabel || content.priceNote || content.durationLabel"
      v-reveal
      class="mx-auto max-w-3xl px-4 py-20"
    >
      <SectionHeading title="Investissement" />
      <div class="mt-8 overflow-hidden rounded-3xl border border-ink/5 bg-white p-8 shadow-soft">
        <p v-if="content.durationLabel" class="text-sm text-ink/55">
          Durée : <span class="font-medium text-ink/80">{{ content.durationLabel }}</span>
        </p>
        <p
          v-if="content.priceLabel"
          class="mt-1 font-display text-3xl font-bold"
          :class="theme.accent"
        >
          {{ content.priceLabel }}
        </p>
        <p v-if="content.priceNote" class="mt-2 whitespace-pre-line leading-relaxed text-ink/70">
          {{ content.priceNote }}
        </p>
        <!-- Franchise en base de TVA (docs/05 §6, ADR #4) — affichée près du prix. -->
        <p class="mt-4 text-xs text-ink/45">TVA non applicable, art. 293 B du CGI.</p>
      </div>
    </section>

    <!-- 8. FAQ (faq_items par scope) -->
    <section v-if="content.faq.length" v-reveal class="bg-teal-50">
      <div class="mx-auto max-w-3xl px-4 py-20">
        <SectionHeading title="Questions fréquentes" align="center" />
        <div class="mt-10">
          <FaqAccordion :items="content.faq" />
        </div>
      </div>
    </section>

    <!-- 9. Témoignage — masqué si vide -->
    <section
      v-if="content.testimonial"
      v-reveal
      class="mx-auto max-w-3xl px-4 py-20"
      aria-label="Témoignage"
    >
      <TestimonialCard :testimonial="content.testimonial" />
    </section>

    <!-- 10. CTA → contact -->
    <section v-reveal class="mx-auto max-w-6xl px-4 py-20">
      <CtaBlock
        :title="content.ctaTitle || 'Travaillons ensemble'"
        :description="content.ctaBody ?? undefined"
        :cta-label="content.ctaLabel"
        to="/contact"
        :variant="variant"
      />
      <p v-if="content.ctaSubtext" class="mt-4 text-center text-sm text-ink/55">
        {{ content.ctaSubtext }}
      </p>
    </section>
  </div>
</template>
