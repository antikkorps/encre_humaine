<script setup lang="ts">
// Hub Particuliers (B2C) — docs/04-particuliers-hub.md. Contenu depuis
// `b2c_hub_page` + faq_items (scope=b2c) + témoignage b2c, via l'endpoint
// serveur caché `/api/content/b2c-hub` (rich text déjà assaini serveur).
// Ton empathique, accent orange. 9 sections ; sections vides masquées ;
// échec → message sobre (panne transitoire ≠ page inexistante).
const { data: content, error } = await useFetch("/api/content/b2c-hub", {
  query: usePreviewQuery(),
});

const siteName = "L'Encre Humaine";
const heading = computed(() => content.value?.accrocheTitle ?? "Pour les particuliers");

useSeoMeta({
  title: () => content.value?.seo.title ?? `Pour les particuliers — ${siteName}`,
  description: () => content.value?.seo.description ?? undefined,
  ogTitle: () => content.value?.seo.title ?? `Pour les particuliers — ${siteName}`,
  ogDescription: () => content.value?.seo.description ?? undefined,
  ogImage: () => content.value?.seo.ogImage ?? undefined,
  ogType: "website",
  robots: () => (content.value?.seo.noIndex ? "noindex, nofollow" : undefined),
});
</script>

<template>
  <div>
    <!-- 1. Accroche empathique (h1 + sous-titre) -->
    <PageHero
      :title="heading"
      eyebrow="Particuliers"
      :body="content?.accrocheSubtitle ?? undefined"
      variant="orange"
    />

    <p
      v-if="error"
      class="mx-auto max-w-6xl px-4 py-16 text-center text-ink/70"
      role="status"
    >
      Le contenu est momentanément indisponible. Merci de réessayer dans un instant.
    </p>

    <template v-else-if="content">
      <!-- Illustration d'accroche optionnelle (Directus) — masquée si absente. -->
      <section v-if="content.accrochePhoto" class="mx-auto max-w-5xl px-4 pt-12">
        <NuxtImg
          :src="content.accrochePhoto.url"
          :alt="content.accrochePhoto.alt"
          :width="content.accrochePhoto.width ?? 1120"
          :height="content.accrochePhoto.height ?? 490"
          fit="cover"
          format="webp"
          sizes="100vw lg:1024px"
          loading="lazy"
          decoding="async"
          class="aspect-[16/7] w-full rounded-3xl object-cover shadow-lift"
        />
      </section>

      <!-- Texte d'accroche -->
      <section v-if="content.accrocheBody" v-reveal class="mx-auto max-w-3xl px-4 pt-16 text-center">
        <p class="whitespace-pre-line text-lg leading-relaxed text-ink/75">
          {{ content.accrocheBody }}
        </p>
      </section>

      <!-- Phrase signature → bandeau marine + CTA doré -->
      <section
        v-if="content.accrocheSignature || content.accrocheCtaLabel"
        v-reveal
        class="mx-auto max-w-6xl px-4 py-14"
      >
        <div
          class="flex flex-col gap-6 rounded-3xl bg-teal-900 p-8 shadow-lift sm:flex-row sm:items-center sm:justify-between sm:p-10"
        >
          <p
            v-if="content.accrocheSignature"
            class="max-w-2xl whitespace-pre-line font-display text-xl font-medium leading-relaxed text-paper"
          >
            <Icon name="material-symbols:format-quote" class="mb-1 block h-8 w-8 text-orange-300" />
            {{ content.accrocheSignature }}
          </p>
          <NuxtLink
            v-if="content.accrocheCtaLabel"
            to="/contact"
            class="inline-flex flex-none items-center gap-2 rounded-full bg-orange-400 px-7 py-3.5 font-semibold text-ink shadow-soft transition-transform hover:-translate-y-0.5"
          >
            {{ content.accrocheCtaLabel }}
            <Icon name="material-symbols:arrow-forward" class="h-5 w-5" />
          </NuxtLink>
        </div>
      </section>

      <!-- 2. Ce que vous venez chercher (bénéfices) -->
      <section v-if="content.outcomes.length" v-reveal class="bg-orange-50">
        <div class="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading
            :title="content.outcomesTitle || 'Ce que vous venez chercher'"
            :subtitle="content.outcomesIntro ?? undefined"
            align="center"
          />
          <ul class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <li
              v-for="(outcome, i) in content.outcomes"
              :key="i"
              class="rounded-3xl border border-ink/5 bg-white p-7 shadow-soft"
            >
              <span
                class="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 text-orange-700 ring-1 ring-orange-200"
              >
                <Icon :name="`material-symbols:${outcome.icon || 'check-circle'}`" class="h-6 w-6" />
              </span>
              <h3 v-if="outcome.title" class="mt-4 font-display text-lg font-semibold text-ink">
                {{ outcome.title }}
              </h3>
              <p v-if="outcome.body" class="mt-2 leading-relaxed text-ink/65">{{ outcome.body }}</p>
            </li>
          </ul>
        </div>
      </section>

      <!-- 3. Deux situations, deux accompagnements (cartes détaillées) -->
      <section v-if="content.situations.length" v-reveal class="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading
          :title="content.situationsTitle || 'Où en êtes-vous ?'"
          :subtitle="content.situationsIntro ?? undefined"
          eyebrow="Accompagnement"
        />
        <div class="mt-10 grid gap-6 md:grid-cols-2">
          <article
            v-for="(situation, i) in content.situations"
            :key="i"
            class="group relative flex flex-col overflow-hidden rounded-3xl border border-ink/5 bg-white p-8 pl-9 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
          >
            <span aria-hidden="true" class="absolute inset-y-0 left-0 w-1.5 bg-orange-400"></span>
            <h2 class="font-display text-2xl font-bold text-ink">{{ situation.title }}</h2>
            <p
              v-if="situation.body"
              class="mt-3 whitespace-pre-line leading-relaxed text-ink/65"
            >
              {{ situation.body }}
            </p>
            <div v-if="situation.audience" class="mt-5">
              <p class="text-xs font-semibold uppercase tracking-wide text-orange-600">Pour qui ?</p>
              <p class="mt-1 whitespace-pre-line leading-relaxed text-ink/70">
                {{ situation.audience }}
              </p>
            </div>
            <div v-if="situation.items.length" class="mt-5">
              <p class="text-xs font-semibold uppercase tracking-wide text-orange-600">
                Ce que nous travaillons
              </p>
              <ul class="mt-2 space-y-2">
                <li
                  v-for="(item, j) in situation.items"
                  :key="j"
                  class="flex items-start gap-2.5 text-ink/75"
                >
                  <Icon
                    name="material-symbols:check-circle-rounded"
                    class="mt-0.5 h-5 w-5 flex-none text-orange-500"
                  />
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>
            <p
              v-if="situation.result"
              class="mt-5 rounded-2xl bg-orange-50 p-4 text-sm leading-relaxed text-ink/75"
            >
              <span class="font-semibold text-orange-700">Résultat — </span>{{ situation.result }}
            </p>
            <NuxtLink
              v-if="situation.ctaLabel"
              :to="situation.ctaLink"
              class="mt-6 inline-flex w-fit items-center gap-1.5 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-orange-600"
            >
              {{ situation.ctaLabel }}
              <span aria-hidden="true">→</span>
            </NuxtLink>
          </article>
        </div>
      </section>

      <!-- 4. Ma façon d'accompagner (rich text assaini + encadré signature) -->
      <section
        v-if="content.howIWorkHtml || content.howIWorkSignature"
        v-reveal
        class="bg-teal-50"
      >
        <div class="mx-auto max-w-3xl px-4 py-20">
          <SectionHeading :title="content.howIWorkTitle || 'Ma façon d\'accompagner'" />
          <RichText v-if="content.howIWorkHtml" :html="content.howIWorkHtml" class="mt-5" />
          <aside
            v-if="content.howIWorkSignature"
            class="mt-8 rounded-3xl border border-orange-200 bg-orange-50/60 p-6"
          >
            <Icon name="material-symbols:format-quote" class="h-7 w-7 text-orange-500" />
            <p class="mt-2 whitespace-pre-line font-display text-lg leading-relaxed text-ink/85">
              {{ content.howIWorkSignature }}
            </p>
          </aside>
        </div>
      </section>

      <!-- 5. Pourquoi cet accompagnement est différent -->
      <section
        v-if="content.whyDifferentHtml"
        v-reveal
        class="mx-auto max-w-3xl px-4 py-20"
      >
        <SectionHeading :title="content.whyDifferentTitle || 'Pourquoi c\'est différent'" />
        <RichText :html="content.whyDifferentHtml" class="mt-5" />
      </section>

      <!-- 6. Comment se déroule l'accompagnement (format + texte) -->
      <section
        v-if="content.formatItems.length || content.formatBody"
        v-reveal
        class="bg-paper-2"
      >
        <div class="mx-auto max-w-3xl px-4 py-20">
          <SectionHeading :title="content.formatTitle || 'Comment se déroule l\'accompagnement'" />
          <ul v-if="content.formatItems.length" class="mt-8 space-y-3">
            <li
              v-for="(item, i) in content.formatItems"
              :key="i"
              class="flex items-start gap-3 text-ink/80"
            >
              <Icon
                name="material-symbols:check-circle-rounded"
                class="mt-0.5 h-5 w-5 flex-none text-orange-500"
              />
              <span>{{ item }}</span>
            </li>
          </ul>
          <p
            v-if="content.formatBody"
            class="mt-8 whitespace-pre-line leading-relaxed text-ink/75"
          >
            {{ content.formatBody }}
          </p>
        </div>
      </section>

      <!-- 7. FAQ (faq_items scope=b2c) -->
      <section v-if="content.faq.length" v-reveal class="bg-orange-50">
        <div class="mx-auto max-w-3xl px-4 py-20">
          <SectionHeading title="Questions fréquentes" align="center" />
          <div class="mt-10">
            <FaqAccordion :items="content.faq" />
          </div>
        </div>
      </section>

      <!-- 8. Témoignages (centralisés, audience=particulier) — masqué si vide -->
      <section
        v-if="content.testimonials.length"
        v-reveal
        class="mx-auto max-w-5xl px-4 py-20"
        aria-label="Témoignages"
      >
        <SectionHeading title="Ce qu'en disent les personnes accompagnées" align="center" />
        <div class="mt-10 grid gap-6 md:grid-cols-2">
          <TestimonialCard
            v-for="(testimonial, i) in content.testimonials"
            :key="i"
            :testimonial="testimonial"
          />
        </div>
      </section>

      <!-- 9. Appel à l'action (bandeau marine mutualisé) -->
      <section v-reveal class="mx-auto max-w-6xl px-4 py-20">
        <CtaBanner
          :title="content.ctaTitle || 'Et si vous vous accordiez un espace pour y voir plus clair ?'"
          :body="content.ctaBody ?? undefined"
          :cta-label="content.ctaLabel"
          to="/contact"
          :subtext="content.ctaSubtext ?? undefined"
        />
      </section>
    </template>
  </div>
</template>
