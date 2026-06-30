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
    <PageHero
      :title="heading"
      eyebrow="Contact"
      :body="content?.accrocheBody ?? undefined"
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
      <!-- 2. Réserver un appel découverte (pleine largeur → calendrier lisible) -->
      <section v-if="content.booking" class="mx-auto max-w-5xl px-4 pt-20">
        <SectionHeading title="Réserver un appel découverte" eyebrow="Prise de RDV" />
        <p class="mt-3 max-w-2xl text-ink/70">
          {{ content.booking.intro || "Réservez un premier échange en visio pour faire connaissance, sans engagement." }}
        </p>
        <div class="mt-8">
          <BookingEmbed :url="content.booking.url" />
        </div>
      </section>

      <!-- 2bis. M'envoyer un message -->
      <section class="mx-auto max-w-xl px-4 py-20">
        <SectionHeading title="M'envoyer un message" eyebrow="Formulaire" />
        <p class="mt-2 text-sm text-ink/55">
          Vos données servent uniquement à traiter votre demande
          (<NuxtLink to="/confidentialite" class="text-teal-700 underline">confidentialité</NuxtLink>).
        </p>
        <div class="mt-6 rounded-3xl border border-ink/5 bg-white p-6 shadow-soft sm:p-8">
          <ContactForm />
        </div>
      </section>

      <!-- 3. Ce qui se passe ensuite -->
      <section v-if="content.nextSteps.length || content.responseTimeNote" class="bg-teal-50">
        <div class="mx-auto max-w-5xl px-4 py-20">
          <SectionHeading title="Ce qui se passe ensuite" align="center" />
          <ol
            v-if="content.nextSteps.length"
            class="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            <li
              v-for="(step, i) in content.nextSteps"
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
          <p v-if="content.responseTimeNote" class="mt-8 text-center text-sm text-ink/60">
            {{ content.responseTimeNote }}
          </p>
        </div>
      </section>

      <!-- 4. FAQ courte (scope=contact) -->
      <section v-if="content.faq.length" class="mx-auto max-w-3xl px-4 py-20">
        <SectionHeading title="Questions fréquentes" align="center" />
        <div class="mt-10">
          <FaqAccordion :items="content.faq" />
        </div>
      </section>

      <!-- 5. Coordonnées directes -->
      <section
        v-if="content.contact.email || content.contact.linkedin || content.contact.location"
        class="bg-ink text-paper"
        aria-label="Coordonnées"
      >
        <div
          class="mx-auto flex max-w-4xl flex-col items-center gap-4 px-4 py-14 text-center sm:flex-row sm:justify-center sm:gap-10"
        >
          <a
            v-if="content.contact.email"
            :href="`mailto:${content.contact.email}`"
            class="inline-flex items-center gap-2 text-paper/85 transition-colors hover:text-teal-300"
          >
            <span aria-hidden="true">✉</span> {{ content.contact.email }}
          </a>
          <a
            v-if="content.contact.linkedin"
            :href="content.contact.linkedin"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-2 text-paper/85 transition-colors hover:text-teal-300"
          >
            <span aria-hidden="true">in</span> LinkedIn
          </a>
          <span v-if="content.contact.location" class="inline-flex items-center gap-2 text-paper/85">
            <span aria-hidden="true">📍</span> {{ content.contact.location }}
          </span>
        </div>
      </section>
    </template>
  </div>
</template>
