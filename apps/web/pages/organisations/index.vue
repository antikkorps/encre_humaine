<script setup lang="ts">
// Hub Organisations (B2B) — docs/03-organisations-hub.md. Contenu depuis
// `org_hub_page` + offres (audience=organisation) + témoignages b2b, via
// l'endpoint serveur caché `/api/content/org-hub`. Rendu SSG/ISR. La page
// oriente (résumé + lien par offre), elle ne détaille pas. Sections vides
// masquées ; en cas d'échec de fetch, message sobre (docs/00 §États).
const { data: content, error } = await useFetch("/api/content/org-hub", {
  query: usePreviewQuery(),
});

const siteName = "L'Encre Humaine";
const heading = computed(() => content.value?.accrocheTitle ?? "Pour les organisations");

useSeoMeta({
  title: () => content.value?.seo.title ?? `Pour les organisations — ${siteName}`,
  description: () => content.value?.seo.description ?? undefined,
  ogTitle: () => content.value?.seo.title ?? `Pour les organisations — ${siteName}`,
  ogDescription: () => content.value?.seo.description ?? undefined,
  ogImage: () => content.value?.seo.ogImage ?? undefined,
  ogType: "website",
  robots: () => (content.value?.seo.noIndex ? "noindex, nofollow" : undefined),
});
</script>

<template>
  <div>
    <!-- 1. Accroche B2B (h1 + sous-titre) -->
    <PageHero
      :title="heading"
      eyebrow="Organisations"
      :body="content?.accrocheSubtitle ?? undefined"
      variant="teal"
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

      <!-- Texte d'accroche + phrase signature + CTA -->
      <section
        v-if="content.accrocheBody || content.accrocheSignature"
        class="mx-auto max-w-3xl px-4 py-16 text-center"
      >
        <p
          v-if="content.accrocheBody"
          class="whitespace-pre-line text-lg leading-relaxed text-ink/75"
        >
          {{ content.accrocheBody }}
        </p>
        <p
          v-if="content.accrocheSignature"
          class="mt-8 font-display text-2xl font-semibold text-teal-700"
        >
          {{ content.accrocheSignature }}
        </p>
        <NuxtLink
          to="/contact"
          class="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 font-semibold text-paper shadow-soft transition-transform hover:-translate-y-0.5"
        >
          Prendre rendez-vous
          <span aria-hidden="true">→</span>
        </NuxtLink>
      </section>

      <!-- 2. Ce que j'observe -->
      <section v-if="content.observe" class="bg-paper-2">
        <div class="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading
            :title="content.observe.title || 'Ce que j\'observe'"
            :subtitle="content.observe.intro ?? undefined"
            eyebrow="Le constat"
            align="center"
          />
          <div v-if="content.observe.items.length" class="mt-10 grid gap-6 sm:grid-cols-2">
            <article
              v-for="(item, i) in content.observe.items"
              :key="i"
              class="rounded-3xl border border-ink/5 bg-white p-7 shadow-soft"
            >
              <h3 v-if="item.title" class="font-display text-lg font-semibold text-ink">
                {{ item.title }}
              </h3>
              <p v-if="item.body" class="mt-2 leading-relaxed text-ink/65">{{ item.body }}</p>
            </article>
          </div>
          <p
            v-if="content.observe.conclusion"
            class="mx-auto mt-10 max-w-2xl whitespace-pre-line text-center text-lg leading-relaxed text-ink/80"
          >
            {{ content.observe.conclusion }}
          </p>
        </div>
      </section>

      <!-- 3. Les offres B2B (dynamique depuis `offers`) -->
      <section v-if="content.offers.length" class="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading :title="content.offersTitle" eyebrow="Accompagnement" align="center" />
        <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <OfferCard v-for="offer in content.offers" :key="offer.slug" :offer="offer" />
        </div>
      </section>

      <!-- 4. Ma façon de travailler -->
      <section v-if="content.method" class="bg-teal-50">
        <div class="mx-auto max-w-5xl px-4 py-20">
          <SectionHeading
            :title="content.method.title || 'Ma façon de travailler'"
            :subtitle="content.method.intro ?? undefined"
            align="center"
          />
          <ol class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <li
              v-for="(step, i) in content.method.steps"
              :key="i"
              class="rounded-3xl border border-ink/5 bg-white p-6 shadow-soft"
            >
              <span
                class="flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 font-display text-lg font-bold text-white"
                aria-hidden="true"
              >
                {{ step.number || i + 1 }}
              </span>
              <h3 v-if="step.title" class="mt-4 font-display text-lg font-semibold text-ink">
                {{ step.title }}
              </h3>
              <p v-if="step.description" class="mt-1.5 text-sm leading-relaxed text-ink/65">
                {{ step.description }}
              </p>
            </li>
          </ol>
        </div>
      </section>

      <!-- 5. Ce qui différencie mon approche -->
      <section v-if="content.differentiator" class="mx-auto max-w-3xl px-4 py-20">
        <SectionHeading :title="content.differentiator.title || 'Mon approche'" />
        <RichText :html="content.differentiator.bodyHtml" class="mt-5" />
      </section>

      <!-- 6. Cet accompagnement est fait pour vous si… -->
      <section v-if="content.audience" class="bg-teal-50">
        <div class="mx-auto max-w-3xl px-4 py-20">
          <SectionHeading :title="content.audience.title || 'Pour qui ?'" />
          <ul v-if="content.audience.items.length" class="mt-8 space-y-3">
            <li
              v-for="(item, i) in content.audience.items"
              :key="i"
              class="flex items-start gap-3 text-ink/80"
            >
              <span
                class="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700"
                aria-hidden="true"
                >✓</span
              >
              <span>{{ item }}</span>
            </li>
          </ul>
          <p
            v-if="content.audience.conclusion"
            class="mt-8 whitespace-pre-line leading-relaxed text-ink/80"
          >
            {{ content.audience.conclusion }}
          </p>
        </div>
      </section>

      <!-- 7. Témoignages B2B — masqués si vides -->
      <section v-if="content.testimonials.length" class="bg-paper-2" aria-label="Témoignages">
        <div class="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading :title="content.testimonialsTitle" align="center" />
          <div class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <TestimonialCard
              v-for="(testimonial, i) in content.testimonials"
              :key="i"
              :testimonial="testimonial"
            />
          </div>
        </div>
      </section>

      <!-- 8. CTA final -->
      <section class="mx-auto max-w-6xl px-4 py-16">
        <CtaBlock
          :title="content.cta.title"
          :description="content.cta.body ?? undefined"
          :cta-label="content.cta.label"
          to="/contact"
        />
        <p v-if="content.cta.subtext" class="mt-4 text-center text-sm text-ink/55">
          {{ content.cta.subtext }}
        </p>
      </section>
    </template>
  </div>
</template>
