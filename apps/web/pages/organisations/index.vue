<script setup lang="ts">
// Hub Organisations (B2B) — docs/03-organisations-hub.md. Contenu depuis
// `org_hub_page` + offres (audience=organisation) + témoignages b2b, via
// l'endpoint serveur caché `/api/content/org-hub`. Rendu SSG/ISR. La page
// oriente (résumé + lien par offre), elle ne détaille pas. Sections vides
// masquées ; en cas d'échec de fetch, message sobre (docs/00 §États).
const { data: content, error } = await useFetch("/api/content/org-hub");

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
    <!-- 1. Accroche B2B (h1) -->
    <section class="bg-teal-700 text-white">
      <div class="mx-auto max-w-4xl px-4 py-16 text-center sm:py-20">
        <h1 class="font-display text-3xl font-bold sm:text-4xl">{{ heading }}</h1>
        <p
          v-if="content?.accrocheBody"
          class="mx-auto mt-4 max-w-2xl whitespace-pre-line text-teal-50"
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
      <!-- 2. Les offres B2B (dynamique depuis `offers`) -->
      <section v-if="content.offers.length" class="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading title="Mes offres pour les organisations" eyebrow="Accompagnement" />
        <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <OfferCard v-for="offer in content.offers" :key="offer.slug" :offer="offer" />
        </div>
      </section>

      <!-- 3. Ma méthode en 4 étapes -->
      <section v-if="content.methodSteps.length" class="bg-teal-50">
        <div class="mx-auto max-w-5xl px-4 py-16">
          <SectionHeading title="Ma méthode" align="center" />
          <ol class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <li
              v-for="(step, i) in content.methodSteps"
              :key="i"
              class="rounded-2xl border border-teal-100 bg-white p-6"
            >
              <span
                class="flex h-9 w-9 items-center justify-center rounded-full bg-teal-700 font-display font-bold text-white"
                aria-hidden="true"
              >
                {{ step.number || i + 1 }}
              </span>
              <h3 v-if="step.title" class="mt-3 font-display text-lg font-semibold text-teal-900">
                {{ step.title }}
              </h3>
              <p v-if="step.description" class="mt-1 text-sm text-teal-700">
                {{ step.description }}
              </p>
            </li>
          </ol>
        </div>
      </section>

      <!-- 4. Pour qui ? -->
      <section v-if="content.audienceItems.length" class="mx-auto max-w-3xl px-4 py-16">
        <SectionHeading title="Pour qui ?" />
        <ul class="mt-6 space-y-3">
          <li
            v-for="(item, i) in content.audienceItems"
            :key="i"
            class="flex gap-3 text-teal-700"
          >
            <span class="mt-1 text-teal-600" aria-hidden="true">✓</span>
            <span>{{ item }}</span>
          </li>
        </ul>
      </section>

      <!-- 5. Témoignages B2B — masqués si vides -->
      <section v-if="content.testimonials.length" class="bg-teal-50" aria-label="Témoignages">
        <div class="mx-auto max-w-6xl px-4 py-16">
          <SectionHeading title="Ils m'ont fait confiance" align="center" />
          <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <TestimonialCard
              v-for="(testimonial, i) in content.testimonials"
              :key="i"
              :testimonial="testimonial"
            />
          </div>
        </div>
      </section>

      <!-- 6. CTA -->
      <section class="mx-auto max-w-6xl px-4 py-16">
        <CtaBlock :title="content.cta.title" :cta-label="content.cta.label" to="/contact" />
      </section>
    </template>
  </div>
</template>
