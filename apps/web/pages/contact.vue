<script setup lang="ts">
// Contact — docs/09-contact.md. Contenu depuis `contact_page` + faq_items
// (scope=contact) + site_settings, via l'endpoint caché `/api/content/contact`.
// Deux voies : prise de RDV (BookingEmbed, Cal.com, chargé au consentement) et
// formulaire (ContactForm, validation partagée + Turnstile serveur). Page chaude :
// simple et rassurante. Sections vides masquées ; échec fetch → message sobre.
const { data: content, error } = await useFetch("/api/content/contact");

const siteName = "L'Encre Humaine";
const heading = computed(() => content.value?.accrocheTitle ?? "Travaillons ensemble");

useSeoMeta({
  title: () => content.value?.seo.title ?? `Travaillons ensemble — ${siteName}`,
  description: () => content.value?.seo.description ?? undefined,
  ogTitle: () => content.value?.seo.title ?? `Travaillons ensemble — ${siteName}`,
  ogDescription: () => content.value?.seo.description ?? undefined,
  ogImage: () => content.value?.seo.ogImage ?? undefined,
  ogType: "website",
  robots: () => (content.value?.seo.noIndex ? "noindex, nofollow" : undefined),
});
</script>

<template>
  <div>
    <!-- 1. Accroche humaine (h1) -->
    <section class="bg-teal-50">
      <div class="mx-auto max-w-3xl px-4 py-16 text-center sm:py-20">
        <h1 class="font-display text-3xl font-bold text-teal-900 sm:text-4xl">{{ heading }}</h1>
        <p
          v-if="content?.accrocheBody"
          class="mx-auto mt-4 max-w-2xl whitespace-pre-line text-teal-700"
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
      <!-- 2. Deux façons de me contacter -->
      <section class="mx-auto max-w-6xl px-4 py-16">
        <div class="grid gap-10 md:grid-cols-2">
          <!-- Appel découverte (masqué si pas d'URL de RDV) -->
          <div v-if="content.booking">
            <SectionHeading title="Réserver un appel découverte" eyebrow="Prise de RDV" />
            <div class="mt-6">
              <BookingEmbed :url="content.booking.url" :intro="content.booking.intro ?? undefined" />
            </div>
          </div>

          <!-- Message -->
          <div :class="content.booking ? '' : 'mx-auto w-full max-w-xl'">
            <SectionHeading title="M'envoyer un message" eyebrow="Formulaire" />
            <p class="mt-2 text-sm text-teal-600">
              Vos données servent uniquement à traiter votre demande
              (<NuxtLink to="/confidentialite" class="underline">confidentialité</NuxtLink>).
            </p>
            <div class="mt-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      <!-- 3. Ce qui se passe ensuite -->
      <section v-if="content.nextSteps.length || content.responseTimeNote" class="bg-teal-50">
        <div class="mx-auto max-w-5xl px-4 py-16">
          <SectionHeading title="Ce qui se passe ensuite" align="center" />
          <ol
            v-if="content.nextSteps.length"
            class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            <li
              v-for="(step, i) in content.nextSteps"
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
          <p v-if="content.responseTimeNote" class="mt-6 text-center text-sm text-teal-600">
            {{ content.responseTimeNote }}
          </p>
        </div>
      </section>

      <!-- 4. FAQ courte (scope=contact) -->
      <section v-if="content.faq.length" class="mx-auto max-w-3xl px-4 py-16">
        <SectionHeading title="Questions fréquentes" align="center" />
        <div class="mt-8">
          <FaqAccordion :items="content.faq" />
        </div>
      </section>

      <!-- 5. Coordonnées directes -->
      <section
        v-if="content.contact.email || content.contact.linkedin || content.contact.location"
        class="bg-teal-50"
        aria-label="Coordonnées"
      >
        <div
          class="mx-auto flex max-w-4xl flex-col items-center gap-3 px-4 py-12 text-center text-teal-700 sm:flex-row sm:justify-center sm:gap-8"
        >
          <a
            v-if="content.contact.email"
            :href="`mailto:${content.contact.email}`"
            class="hover:text-teal-900"
          >
            ✉️ {{ content.contact.email }}
          </a>
          <a
            v-if="content.contact.linkedin"
            :href="content.contact.linkedin"
            target="_blank"
            rel="noopener"
            class="hover:text-teal-900"
          >
            in LinkedIn
          </a>
          <span v-if="content.contact.location">📍 {{ content.contact.location }}</span>
        </div>
      </section>
    </template>
  </div>
</template>
