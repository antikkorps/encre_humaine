<script setup lang="ts">
// Contact — docs/09-contact.md. Contenu depuis `contact_page` + faq_items
// (scope=contact) + site_settings, via l'endpoint caché `/api/content/contact`.
// Deux voies : prise de RDV (BookingEmbed, Cal.com, chargé au consentement) et
// formulaire (ContactForm, validation partagée + Turnstile serveur). Page chaude :
// simple et rassurante. Sections vides masquées ; échec fetch → message sobre.
const { data: content, error } = await useFetch("/api/content/contact", {
  query: usePreviewQuery(),
});

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
    <!-- 1. Accroche humaine (h1) + double CTA → section contact ; situations en carte aside -->
    <PageHero
      :title="heading"
      eyebrow="Contact"
      variant="teal"
    >
      <template v-if="content?.accrocheBody" #aside>
        <figure
          class="relative overflow-hidden rounded-[1.75rem] border border-ink/10 bg-white/70 p-8 shadow-lift backdrop-blur-sm"
        >
          <div class="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-teal-100/70" aria-hidden="true"></div>
          <span
            class="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-900 text-orange-300 shadow-soft"
          >
            <Icon name="material-symbols:forum" class="h-6 w-6" />
          </span>
          <p class="relative mt-5 whitespace-pre-line text-[1.05rem] leading-relaxed text-ink/75">
            {{ content.accrocheBody }}
          </p>
        </figure>
      </template>

      <div class="mt-8 flex flex-wrap gap-3">
        <NuxtLink
          to="#contact"
          class="inline-flex items-center gap-2 rounded-full bg-teal-700 px-7 py-3.5 font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5"
        >
          Réserver un échange <span aria-hidden="true">→</span>
        </NuxtLink>
        <NuxtLink
          to="#contact"
          class="inline-flex items-center gap-2 rounded-full border border-ink/15 px-7 py-3.5 font-semibold text-ink/80 transition-colors hover:border-teal-300 hover:bg-teal-50"
        >
          M'envoyer un message
        </NuxtLink>
      </div>
    </PageHero>

    <p
      v-if="error"
      class="mx-auto max-w-6xl px-4 py-16 text-center text-ink/70"
      role="status"
    >
      Le contenu est momentanément indisponible. Merci de réessayer dans un instant.
    </p>

    <template v-else-if="content">
      <!-- 2. Deux voies de contact, en onglets (un seul bloc visible à la fois) -->
      <section id="contact" class="mx-auto max-w-5xl scroll-mt-20 px-4 py-20">
        <SectionHeading
          title="Deux façons de me contacter"
          subtitle="Choisissez ce qui vous convient le mieux."
          eyebrow="Échangeons"
        />
        <TabsRoot :default-value="content.booking ? 'booking' : 'message'" class="mt-8">
          <TabsList
            class="mb-8 flex flex-wrap gap-1 border-b border-ink/10"
            aria-label="Façons de me contacter"
          >
            <TabsTrigger
              v-if="content.booking"
              value="booking"
              class="-mb-px border-b-2 border-transparent px-4 py-3 font-display text-base font-medium text-ink/55 transition-colors hover:text-ink data-[state=active]:border-teal-700 data-[state=active]:text-teal-800"
            >
              Réserver un appel
            </TabsTrigger>
            <TabsTrigger
              value="message"
              class="-mb-px border-b-2 border-transparent px-4 py-3 font-display text-base font-medium text-ink/55 transition-colors hover:text-ink data-[state=active]:border-teal-700 data-[state=active]:text-teal-800"
            >
              M'envoyer un message
            </TabsTrigger>
          </TabsList>

          <TabsContent v-if="content.booking" value="booking" class="focus:outline-none">
            <p class="mb-6 max-w-2xl text-ink/70">
              {{ content.booking.intro || "Réservez un premier échange en visio pour faire connaissance, sans engagement." }}
            </p>
            <BookingEmbed :url="content.booking.url" />
            <p
              v-if="content.booking.reassurance"
              class="mt-6 max-w-2xl text-sm text-ink/60"
            >
              {{ content.booking.reassurance }}
            </p>
          </TabsContent>

          <TabsContent value="message" class="mx-auto max-w-xl focus:outline-none">
            <p v-if="content.messageIntro" class="mb-4 whitespace-pre-line text-ink/70">
              {{ content.messageIntro }}
            </p>
            <p class="mb-6 text-sm text-ink/55">
              Vos données servent uniquement à traiter votre demande
              (<NuxtLink to="/confidentialite" class="text-teal-700 underline">confidentialité</NuxtLink>).
            </p>
            <div class="rounded-3xl border border-ink/5 bg-white p-6 shadow-soft sm:p-8">
              <ContactForm />
            </div>
          </TabsContent>
        </TabsRoot>
      </section>

      <!-- 3. Comment se déroule le premier échange -->
      <section
        v-if="content.nextSteps.length || content.responseTimeNote || content.stepsConclusion"
        class="bg-teal-50"
      >
        <div class="mx-auto max-w-5xl px-4 py-20">
          <SectionHeading title="Comment se déroule le premier échange" eyebrow="Le premier pas" />
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
          <p
            v-if="content.stepsConclusion"
            class="mt-10 max-w-2xl whitespace-pre-line leading-relaxed text-ink/75"
          >
            {{ content.stepsConclusion }}
          </p>
          <p v-if="content.responseTimeNote" class="mt-8 text-sm text-ink/60">
            {{ content.responseTimeNote }}
          </p>
        </div>
      </section>

      <!-- 4. Vous pouvez me contacter si… (organisations / particuliers) -->
      <section v-if="content.reasons" class="mx-auto max-w-5xl px-4 py-20">
        <SectionHeading :title="content.reasons.title || 'Vous pouvez me contacter si…'" eyebrow="Quand me contacter" />
        <div class="mt-10 grid gap-6 md:grid-cols-2">
          <div v-if="content.reasons.org.length" class="rounded-3xl border border-ink/5 bg-white p-8 shadow-soft">
            <p class="font-display text-lg font-bold text-teal-800">Pour les organisations</p>
            <ul class="mt-4 space-y-3">
              <li
                v-for="(item, i) in content.reasons.org"
                :key="i"
                class="flex items-start gap-3 text-ink/75"
              >
                <span class="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700" aria-hidden="true">✓</span>
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>
          <div v-if="content.reasons.b2c.length" class="rounded-3xl border border-ink/5 bg-white p-8 shadow-soft">
            <p class="font-display text-lg font-bold text-orange-700">Pour les particuliers</p>
            <ul class="mt-4 space-y-3">
              <li
                v-for="(item, i) in content.reasons.b2c"
                :key="i"
                class="flex items-start gap-3 text-ink/75"
              >
                <span class="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700" aria-hidden="true">✓</span>
                <span>{{ item }}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- 5. FAQ courte (scope=contact) -->
      <section v-if="content.faq.length" class="mx-auto max-w-5xl px-4 py-20">
        <div class="max-w-3xl">
          <SectionHeading title="Questions fréquentes" eyebrow="FAQ" />
          <div class="mt-10">
            <FaqAccordion :items="content.faq" />
          </div>
        </div>
      </section>

      <!-- 6. CTA final → section contact -->
      <section v-if="content.finalCta" class="mx-auto max-w-6xl px-4 py-16">
        <CtaBlock
          :title="content.finalCta.title || 'Parlons-en'"
          :description="content.finalCta.body ?? undefined"
          cta-label="Réserver un échange"
          to="#contact"
          variant="teal"
        />
      </section>

      <!-- 7. Coordonnées directes -->
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
