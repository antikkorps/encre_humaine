<script setup lang="ts">
// Hub Particuliers (B2C) — docs/04-particuliers-hub.md. Contenu depuis
// `b2c_hub_page` + faq_items (scope=b2c) + témoignage b2c, via l'endpoint
// serveur caché `/api/content/b2c-hub` (rich text déjà assaini serveur).
// Ton empathique, accent orange. Sections vides masquées ; échec → message sobre.
const { data: content, error } = await useFetch("/api/content/b2c-hub");

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
    <!-- 1. Accroche empathique (h1) -->
    <section class="bg-orange-600 text-white">
      <div class="mx-auto max-w-4xl px-4 py-16 text-center sm:py-20">
        <h1 class="font-display text-3xl font-bold sm:text-4xl">{{ heading }}</h1>
        <p
          v-if="content?.accrocheBody"
          class="mx-auto mt-4 max-w-2xl whitespace-pre-line text-orange-50"
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
      <!-- 2. Deux situations, deux offres -->
      <section v-if="content.situations.length" class="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading title="Où en êtes-vous ?" eyebrow="Accompagnement" />
        <div class="mt-8 grid gap-6 md:grid-cols-2">
          <article
            v-for="(situation, i) in content.situations"
            :key="i"
            class="flex flex-col rounded-2xl border border-orange-100 bg-orange-50/50 p-6"
          >
            <h2 class="font-display text-xl font-bold text-teal-900">{{ situation.title }}</h2>
            <p v-if="situation.body" class="mt-3 flex-1 whitespace-pre-line text-teal-700">
              {{ situation.body }}
            </p>
            <NuxtLink
              v-if="situation.ctaLabel"
              :to="situation.ctaLink"
              class="mt-5 inline-flex w-fit items-center rounded-full bg-orange-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-700"
            >
              {{ situation.ctaLabel }}
            </NuxtLink>
          </article>
        </div>
      </section>

      <!-- 3. Comment je travaille (rich text assaini) -->
      <section v-if="content.howIWorkHtml" class="bg-teal-50">
        <div class="mx-auto max-w-3xl px-4 py-16">
          <SectionHeading title="Comment je travaille" />
          <RichText :html="content.howIWorkHtml" class="mt-4" />
        </div>
      </section>

      <!-- 4. Témoignage — masqué si vide -->
      <section
        v-if="content.testimonial"
        class="mx-auto max-w-3xl px-4 py-16"
        aria-label="Témoignage"
      >
        <TestimonialCard :testimonial="content.testimonial" />
      </section>

      <!-- 5. FAQ (faq_items scope=b2c) -->
      <section v-if="content.faq.length" class="bg-teal-50">
        <div class="mx-auto max-w-3xl px-4 py-16">
          <SectionHeading title="Questions fréquentes" align="center" />
          <div class="mt-8">
            <FaqAccordion :items="content.faq" />
          </div>
        </div>
      </section>

      <!-- 6. CTA -->
      <section class="mx-auto max-w-6xl px-4 py-16">
        <CtaBlock
          title="Prêt·e à avancer ?"
          :cta-label="content.ctaLabel"
          to="/contact"
          variant="orange"
        />
      </section>
    </template>
  </div>
</template>
