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
    <PageHero
      :title="heading"
      eyebrow="Particuliers"
      :body="content?.accrocheBody ?? undefined"
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

      <!-- 2. Deux situations, deux offres -->
      <section v-if="content.situations.length" class="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading title="Où en êtes-vous ?" eyebrow="Accompagnement" />
        <div class="mt-10 grid gap-6 md:grid-cols-2">
          <article
            v-for="(situation, i) in content.situations"
            :key="i"
            class="group relative flex flex-col overflow-hidden rounded-3xl border border-ink/5 bg-white p-8 pl-9 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
          >
            <span aria-hidden="true" class="absolute inset-y-0 left-0 w-1.5 bg-orange-400"></span>
            <h2 class="font-display text-2xl font-bold text-ink">{{ situation.title }}</h2>
            <p v-if="situation.body" class="mt-3 flex-1 whitespace-pre-line leading-relaxed text-ink/65">
              {{ situation.body }}
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

      <!-- 3. Comment je travaille (rich text assaini) -->
      <section v-if="content.howIWorkHtml" class="bg-teal-50">
        <div class="mx-auto max-w-3xl px-4 py-20">
          <SectionHeading title="Comment je travaille" />
          <RichText :html="content.howIWorkHtml" class="mt-5" />
        </div>
      </section>

      <!-- 4. Témoignage — masqué si vide -->
      <section
        v-if="content.testimonial"
        class="mx-auto max-w-3xl px-4 py-20"
        aria-label="Témoignage"
      >
        <TestimonialCard :testimonial="content.testimonial" />
      </section>

      <!-- 5. FAQ (faq_items scope=b2c) -->
      <section v-if="content.faq.length" class="bg-paper-2">
        <div class="mx-auto max-w-3xl px-4 py-20">
          <SectionHeading title="Questions fréquentes" align="center" />
          <div class="mt-10">
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
