<script setup lang="ts">
// À propos — docs/02-a-propos.md. Contenu depuis `about_page` via l'endpoint
// serveur caché `/api/content/about` (rich text déjà assaini serveur). Rendu
// SSG/ISR, 2 colonnes desktop / empilé mobile. Sections vides masquées ;
// en cas d'échec de fetch, message sobre (docs/00 §États).
const { data: content, error } = await useFetch("/api/content/about");

const siteName = "L'Encre Humaine";
// h1 = titre de l'accroche (docs/02 §A11y) ; fallback d'affichage si vide.
const heading = computed(() => content.value?.accroche ?? "À propos");

useSeoMeta({
  title: () => content.value?.seo.title ?? `À propos — ${siteName}`,
  description: () => content.value?.seo.description ?? undefined,
  ogTitle: () => content.value?.seo.title ?? `À propos — ${siteName}`,
  ogDescription: () => content.value?.seo.description ?? undefined,
  ogImage: () => content.value?.seo.ogImage ?? undefined,
  ogType: "website",
  robots: () => (content.value?.seo.noIndex ? "noindex, nofollow" : undefined),
});
</script>

<template>
  <div>
    <!-- 1. Accroche (h1) -->
    <PageHero :title="heading" eyebrow="À propos" variant="neutral" />

    <p
      v-if="error"
      class="mx-auto max-w-6xl px-4 py-16 text-center text-ink/70"
      role="status"
    >
      Le contenu est momentanément indisponible. Merci de réessayer dans un instant.
    </p>

    <template v-else-if="content">
      <!-- 2. Mon histoire (photo gauche / texte droite desktop) -->
      <section v-if="content.story?.bodyHtml || content.story?.photo" class="mx-auto max-w-6xl px-4 py-20">
        <div class="grid items-start gap-10 md:grid-cols-2">
          <div v-if="content.story.photo" class="relative">
            <span
              aria-hidden="true"
              class="absolute -left-3 -top-3 -z-10 h-full w-full rounded-3xl bg-teal-100"
            ></span>
            <img
              :src="content.story.photo.url"
              :alt="content.story.photo.alt"
              loading="lazy"
              decoding="async"
              class="aspect-[4/5] w-full rounded-3xl object-cover shadow-lift"
            />
          </div>
          <div :class="content.story.photo ? '' : 'md:col-span-2 mx-auto max-w-2xl'">
            <SectionHeading title="Mon histoire" eyebrow="Parcours" />
            <RichText :html="content.story.bodyHtml" class="mt-5" />
          </div>
        </div>
      </section>

      <!-- 3. Pourquoi L'Encre Humaine -->
      <section v-if="content.why?.bodyHtml" class="bg-teal-50">
        <div class="mx-auto max-w-3xl px-4 py-20">
          <SectionHeading :title="content.why.title || 'Pourquoi L\'Encre Humaine'" />
          <RichText :html="content.why.bodyHtml" class="mt-5" />
        </div>
      </section>

      <!-- 4. Le poulpe (ton avec humour) — clin d'œil à la mascotte -->
      <section v-if="content.octopusHtml" class="relative isolate overflow-hidden">
        <div class="mx-auto grid max-w-5xl items-center gap-8 px-4 py-20 md:grid-cols-[auto_1fr]">
          <OctopusLogo class="mx-auto h-32 w-32 text-teal-600 md:h-40 md:w-40" />
          <div>
            <SectionHeading title="Le poulpe" eyebrow="Pourquoi ce nom" />
            <RichText :html="content.octopusHtml" class="mt-5" />
          </div>
        </div>
      </section>

      <!-- 5. Ce en quoi je crois -->
      <section v-if="content.convictions.length" class="bg-paper-2">
        <div class="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading title="Ce en quoi je crois" align="center" />
          <ul class="mt-10 grid gap-6 sm:grid-cols-2">
            <li
              v-for="(conviction, i) in content.convictions"
              :key="i"
              class="rounded-3xl border border-ink/5 bg-white p-7 shadow-soft"
            >
              <h3 v-if="conviction.title" class="font-display text-lg font-semibold text-ink">
                {{ conviction.title }}
              </h3>
              <p v-if="conviction.body" class="mt-2 leading-relaxed text-ink/65">{{ conviction.body }}</p>
            </li>
          </ul>
        </div>
      </section>

      <!-- 6. Ma façon de travailler -->
      <section v-if="content.howIWork.length" class="mx-auto max-w-3xl px-4 py-20">
        <SectionHeading title="Ma façon de travailler" />
        <ul class="mt-8 space-y-3">
          <li
            v-for="(step, i) in content.howIWork"
            :key="i"
            class="flex items-start gap-3 text-ink/80"
          >
            <span
              class="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600"
              aria-hidden="true"
              >→</span
            >
            <span>{{ step }}</span>
          </li>
        </ul>
      </section>

      <!-- 7. Ce que je ne fais pas -->
      <section v-if="content.whatIDontDoHtml" class="bg-teal-50">
        <div class="mx-auto max-w-3xl px-4 py-20">
          <SectionHeading title="Ce que je ne fais pas" />
          <RichText :html="content.whatIDontDoHtml" class="mt-5" />
        </div>
      </section>

      <!-- 8. Portrait + citation -->
      <section
        v-if="content.portrait?.quote || content.portrait?.photo"
        class="mx-auto max-w-4xl px-4 py-20"
        aria-label="Portrait"
      >
        <figure class="flex flex-col items-center gap-6 text-center">
          <img
            v-if="content.portrait.photo"
            :src="content.portrait.photo.url"
            :alt="content.portrait.photo.alt"
            loading="lazy"
            decoding="async"
            class="h-40 w-40 rounded-full object-cover shadow-lift ring-4 ring-teal-100"
          />
          <blockquote v-if="content.portrait.quote" class="max-w-2xl">
            <p class="font-display text-2xl leading-relaxed text-ink">
              «&#160;{{ content.portrait.quote }}&#160;»
            </p>
          </blockquote>
        </figure>
      </section>

      <!-- 9. CTA -->
      <section class="mx-auto max-w-6xl px-4 pb-20">
        <CtaBlock
          title="Travaillons ensemble"
          :cta-label="content.ctaLabel"
          to="/contact"
          variant="orange"
        />
      </section>
    </template>
  </div>
</template>
