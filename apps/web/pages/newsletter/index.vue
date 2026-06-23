<script setup lang="ts">
// Newsletter « Le Fil » — docs/08-newsletter.md. Contenu depuis `newsletter_page`
// via l'endpoint caché `/api/content/newsletter` (promesse rich text assainie
// serveur). Inscription via `NewsletterForm` (double opt-in, Turnstile). Sections
// vides masquées ; échec fetch → message sobre.
const { data: content, error } = await useFetch("/api/content/newsletter");

const siteName = "L'Encre Humaine";
const heading = computed(() => content.value?.name ?? "La newsletter");

useSeoMeta({
  title: () => content.value?.seo.title ?? `${heading.value} — ${siteName}`,
  description: () => content.value?.seo.description ?? undefined,
  ogTitle: () => content.value?.seo.title ?? `${heading.value} — ${siteName}`,
  ogDescription: () => content.value?.seo.description ?? undefined,
  ogImage: () => content.value?.seo.ogImage ?? undefined,
  ogType: "website",
  robots: () => (content.value?.seo.noIndex ? "noindex, nofollow" : undefined),
});
</script>

<template>
  <div>
    <!-- 1. Nom & promesse (h1) -->
    <PageHero :title="heading" eyebrow="Le Fil" variant="teal">
      <template v-if="content?.promiseHtml" #default>
        <RichText
          :html="content.promiseHtml"
          class="mx-auto mt-5 max-w-2xl text-lg text-ink/70"
        />
      </template>
    </PageHero>

    <p
      v-if="error"
      class="mx-auto max-w-6xl px-4 py-16 text-center text-ink/70"
      role="status"
    >
      Le contenu est momentanément indisponible. Merci de réessayer dans un instant.
    </p>

    <template v-else-if="content">
      <section class="mx-auto max-w-4xl px-4 py-20">
        <div class="grid gap-10 md:grid-cols-2">
          <!-- 2. Ce que vous recevez -->
          <div v-if="content.whatYouReceive.length">
            <SectionHeading title="Ce que vous recevez" />
            <ul class="mt-6 space-y-3">
              <li
                v-for="(item, i) in content.whatYouReceive"
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
            <!-- 4. Cadeau de bienvenue -->
            <p
              v-if="content.welcomeGiftLabel"
              class="mt-6 flex items-start gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-ink/80"
            >
              <span aria-hidden="true">🎁</span>
              <span>Cadeau de bienvenue : <strong class="text-orange-700">{{ content.welcomeGiftLabel }}</strong></span>
            </p>
          </div>

          <!-- 3. Formulaire -->
          <div :class="content.whatYouReceive.length ? '' : 'mx-auto w-full max-w-xl'">
            <SectionHeading title="S'abonner" eyebrow="Inscription" />
            <div class="mt-6 rounded-3xl border border-ink/5 bg-white p-6 shadow-soft sm:p-7">
              <NewsletterForm />
            </div>
          </div>
        </div>

        <!-- 5. Aperçu d'un numéro -->
        <figure
          v-if="content.sample"
          class="mt-12 rounded-3xl border border-ink/5 bg-paper-2 p-7 shadow-soft"
        >
          <figcaption
            v-if="content.sample.issueLabel"
            class="text-xs font-semibold uppercase tracking-[0.1em] text-brand-accent"
          >
            {{ content.sample.issueLabel }}
          </figcaption>
          <blockquote class="mt-2 whitespace-pre-line italic leading-relaxed text-ink/75">
            {{ content.sample.excerpt }}
          </blockquote>
        </figure>
      </section>
    </template>
  </div>
</template>
