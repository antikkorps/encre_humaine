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
    <section class="bg-teal-50">
      <div class="mx-auto max-w-3xl px-4 py-16 text-center sm:py-20">
        <h1 class="font-display text-3xl font-bold text-teal-900 sm:text-4xl">{{ heading }}</h1>
        <RichText
          v-if="content?.promiseHtml"
          :html="content.promiseHtml"
          class="mx-auto mt-4 max-w-2xl text-teal-700"
        />
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
      <section class="mx-auto max-w-3xl px-4 py-16">
        <div class="grid gap-10 md:grid-cols-2">
          <!-- 2. Ce que vous recevez -->
          <div v-if="content.whatYouReceive.length">
            <SectionHeading title="Ce que vous recevez" />
            <ul class="mt-6 space-y-3">
              <li
                v-for="(item, i) in content.whatYouReceive"
                :key="i"
                class="flex gap-3 text-teal-700"
              >
                <span class="mt-1 text-teal-600" aria-hidden="true">✓</span>
                <span>{{ item }}</span>
              </li>
            </ul>
            <!-- 4. Cadeau de bienvenue -->
            <p
              v-if="content.welcomeGiftLabel"
              class="mt-6 rounded-xl bg-orange-50 px-4 py-3 text-sm text-teal-800"
            >
              🎁 Cadeau de bienvenue : <strong>{{ content.welcomeGiftLabel }}</strong>
            </p>
          </div>

          <!-- 3. Formulaire -->
          <div :class="content.whatYouReceive.length ? '' : 'mx-auto w-full max-w-xl'">
            <SectionHeading title="S'abonner" eyebrow="Le Fil" />
            <div class="mt-6">
              <NewsletterForm />
            </div>
          </div>
        </div>

        <!-- 5. Aperçu d'un numéro -->
        <figure
          v-if="content.sample"
          class="mt-12 rounded-2xl border border-teal-100 bg-white p-6"
        >
          <figcaption v-if="content.sample.issueLabel" class="text-sm font-medium text-teal-500">
            {{ content.sample.issueLabel }}
          </figcaption>
          <blockquote class="mt-2 whitespace-pre-line text-teal-700">
            {{ content.sample.excerpt }}
          </blockquote>
        </figure>
      </section>
    </template>
  </div>
</template>
