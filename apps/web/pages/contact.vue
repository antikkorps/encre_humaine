<script setup lang="ts">
// Contact — docs/09-contact.md. Contenu depuis `contact_page` + faq_items
// (scope=contact) + site_settings, via l'endpoint caché `/api/content/contact`.
// Deux voies : prise de RDV (BookingEmbed, Cal.com, chargé au consentement) et
// formulaire (ContactForm, validation partagée + Turnstile serveur). Page chaude :
// simple et rassurante. Sections vides masquées ; échec fetch → message sobre.
// Illustration signée Éléonore (le poulpe qui répond au courrier) : asset local
// → import Vite, comme le poulpe stagiaire de la 404. Le provider @nuxt/image
// est bindé à Directus et ne sert que les médias distants.
import contactIllustration from "~/assets/contact/Contact.webp";

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
      :body="content?.accrocheSubtitle ?? undefined"
      variant="neutral"
      tentacle-side="left"
    >
      <!-- L'illustration prend la place de la carte « constat » : le dessin dit
           déjà ce que la carte disait (« merci pour votre message, je réponds
           bientôt »). Le texte d'accroche repasse dans la colonne de gauche. -->
      <template #aside>
        <figure class="relative">
          <img
            :src="contactIllustration"
            alt="Illustration : un poulpe attablé écrit à la plume « Bonjour, merci pour votre message. Je vous réponds très bientôt. Eléonore », entouré d'enveloppes, d'un encrier « L'Encre Humaine » et d'une tasse « à votre écoute » — signée Éléonore."
            width="1600"
            height="1311"
            decoding="async"
            fetchpriority="high"
            class="mx-auto w-full max-w-lg select-none lg:max-w-none"
          />
        </figure>
      </template>

      <p
        v-if="content?.accrocheBody"
        class="mt-6 max-w-xl whitespace-pre-line leading-relaxed text-ink/70"
      >
        <AccentText :text="content.accrocheBody" />
      </p>

      <div class="mt-8 flex flex-wrap gap-3">
        <NuxtLink
          to="#rdv"
          class="inline-flex items-center gap-2 rounded-full bg-teal-700 px-7 py-3.5 font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5"
        >
          Réserver un échange <span aria-hidden="true">→</span>
        </NuxtLink>
        <NuxtLink
          to="#message"
          class="inline-flex items-center gap-2 rounded-full bg-orange-400 px-7 py-3.5 font-semibold text-ink shadow-soft transition-transform hover:-translate-y-0.5"
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
      <!-- 2. Premier contact : deux cartes d'orientation, puis les deux blocs
           (RDV / message) l'un sous l'autre — plus d'onglets, tout est visible. -->
      <section id="contact" v-reveal class="relative isolate scroll-mt-20 overflow-hidden">
        <TentacleAccent
          side="right"
          name="tentacule-1-trait"
          class="absolute -right-16 -top-10 -z-10 hidden w-[26rem] rotate-12 text-teal-700/[0.06] lg:block"
        />
        <div class="mx-auto max-w-5xl px-4 py-20">
          <SectionHeading
            title="Deux façons de commencer la conversation"
            :subtitle="content.contactIntro ?? undefined"
            eyebrow="Premier contact"
            align="center"
          />
          <div class="mt-10 grid gap-6 md:grid-cols-2">
            <article
              v-if="content.booking"
              class="flex flex-col rounded-3xl border border-ink/5 bg-white p-7 shadow-soft"
            >
              <span
                class="grid h-12 w-12 place-items-center rounded-full bg-sand-400 text-ink-900"
                aria-hidden="true"
              >
                <Icon name="material-symbols:event" class="h-6 w-6" />
              </span>
              <h3 class="mt-4 font-display text-xl font-semibold text-ink">Réserver un échange</h3>
              <p
                v-if="content.booking.intro"
                class="mt-2 whitespace-pre-line text-left leading-relaxed text-ink/65"
              >
                <AccentText :text="content.booking.intro" />
              </p>
              <NuxtLink
                to="#rdv"
                class="mt-auto inline-flex w-fit items-center gap-1.5 pt-6 font-semibold text-brand-accent"
              >
                Réserver un échange <span aria-hidden="true">→</span>
              </NuxtLink>
            </article>

            <article class="flex flex-col rounded-3xl border border-ink/5 bg-white p-7 shadow-soft">
              <span
                class="grid h-12 w-12 place-items-center rounded-full bg-teal-900 text-sand-300"
                aria-hidden="true"
              >
                <Icon name="material-symbols:forum" class="h-6 w-6" />
              </span>
              <h3 class="mt-4 font-display text-xl font-semibold text-ink">M'envoyer un message</h3>
              <p
                v-if="content.messageIntro"
                class="mt-2 whitespace-pre-line text-left leading-relaxed text-ink/65"
              >
                <AccentText :text="content.messageIntro" />
              </p>
              <NuxtLink
                to="#message"
                class="mt-auto inline-flex w-fit items-center gap-1.5 pt-6 font-semibold text-brand-accent"
              >
                M'envoyer un message <span aria-hidden="true">→</span>
              </NuxtLink>
            </article>
          </div>

          <!-- Prise de RDV (chargée au consentement) -->
          <div v-if="content.booking" id="rdv" class="mt-16 scroll-mt-24">
            <BookingEmbed :url="content.booking.url" />
            <p
              v-if="content.booking.reassurance"
              class="mt-6 text-center text-sm text-ink/60"
            >
              <AccentText :text="content.booking.reassurance" />
            </p>
          </div>

          <!-- Formulaire message -->
          <div id="message" class="mx-auto mt-16 max-w-xl scroll-mt-24">
            <p class="mb-6 text-center text-sm text-ink/55">
              Vos données servent uniquement à traiter votre demande
              (<NuxtLink to="/confidentialite" class="text-teal-700 underline">confidentialité</NuxtLink>).
            </p>
            <div class="rounded-3xl border border-ink/5 bg-white p-6 shadow-soft sm:p-8">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      <!-- 3. À quoi vous attendre — panneau marine + frise dorée centrée, dans
           l'esprit du bloc « Ma méthode » de l'accueil (demande Éléonore). -->
      <section
        v-if="content.nextSteps.length || content.responseTimeNote || content.stepsConclusion"
        v-reveal
        class="bg-ink-gradient relative isolate overflow-hidden text-paper"
      >
        <TentacleAccent
          side="left"
          name="tentacule-5-plein"
          class="absolute -left-20 -top-16 -z-10 hidden w-[28rem] text-sand-300/[0.06] lg:block"
        />
        <div class="mx-auto max-w-6xl px-4 py-20 lg:py-24">
          <SectionHeading
            :title="content.stepsTitle || 'Comment se déroule notre premier échange ?'"
            eyebrow="À quoi vous attendre"
            tone="dark"
            align="center"
            wide
          />
          <ol
            v-if="content.nextSteps.length"
            class="mx-auto mt-14 flex max-w-5xl flex-wrap justify-center gap-x-8 gap-y-12"
          >
            <li
              v-for="(step, i) in content.nextSteps"
              :key="i"
              class="relative w-full text-center sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)]"
            >
              <!-- Filet doré reliant les pastilles d'une même ligne (desktop). -->
              <span
                v-if="i < content.nextSteps.length - 1 && (i + 1) % 3 !== 0"
                aria-hidden="true"
                class="absolute left-1/2 top-6 hidden h-px w-[calc(100%+2rem)] bg-sand-400/30 lg:block"
              ></span>
              <span
                aria-hidden="true"
                class="relative mx-auto grid h-12 w-12 place-items-center rounded-full bg-sand-400 font-display text-lg font-bold text-ink-900"
              >
                {{ step.number || i + 1 }}
              </span>
              <h3 v-if="step.title" class="mt-5 font-display text-lg font-bold text-paper">
                <AccentText :text="step.title" tone="dark" />
              </h3>
              <p
                v-if="step.description"
                class="mt-2 whitespace-pre-line text-center leading-relaxed text-paper/70"
              >
                <AccentText :text="step.description" tone="dark" />
              </p>
            </li>
          </ol>
          <p
            v-if="content.stepsConclusion"
            class="mx-auto mt-14 max-w-2xl whitespace-pre-line text-center leading-relaxed text-paper/80"
          >
            <AccentText :text="content.stepsConclusion" tone="dark" />
          </p>
          <p
            v-if="content.responseTimeNote"
            class="mx-auto mt-6 max-w-2xl text-center text-sm text-paper/60"
          >
            <AccentText :text="content.responseTimeNote" tone="dark" />
          </p>
        </div>
      </section>

      <!-- 4. Pour quelles situations ? (organisations / particuliers) -->
      <section v-if="content.reasons" v-reveal class="relative isolate overflow-hidden">
        <TentacleAccent
          side="right"
          name="tentacule-3-trait"
          class="absolute -right-16 top-8 -z-10 hidden w-[28rem] text-teal-700/[0.06] lg:block"
        />
        <div class="mx-auto max-w-5xl px-4 py-20">
          <SectionHeading
            :title="content.reasons.title || 'Vous pouvez me contacter si…'"
            eyebrow="Pour quelles situations ?"
          />
          <div class="mt-10 grid gap-6 md:grid-cols-2">
            <div
              v-if="content.reasons.org.length"
              class="rounded-3xl border border-ink/5 bg-white p-8 shadow-soft"
            >
              <p class="font-display text-lg font-bold text-teal-800">Pour les organisations</p>
              <p v-if="content.reasons.orgLead" class="mt-1 text-left text-ink/60">
                <AccentText :text="content.reasons.orgLead" />
              </p>
              <ul class="mt-4 space-y-3">
                <li
                  v-for="(item, i) in content.reasons.org"
                  :key="i"
                  class="flex items-start gap-3 text-ink/75"
                >
                  <Icon
                    name="material-symbols:check-circle-rounded"
                    class="mt-0.5 h-5 w-5 flex-none text-orange-500"
                  />
                  <span><AccentText :text="item" /></span>
                </li>
              </ul>
            </div>
            <div
              v-if="content.reasons.b2c.length"
              class="rounded-3xl border border-ink/5 bg-white p-8 shadow-soft"
            >
              <p class="font-display text-lg font-bold text-orange-700">Pour les particuliers</p>
              <p v-if="content.reasons.b2cLead" class="mt-1 text-left text-ink/60">
                <AccentText :text="content.reasons.b2cLead" />
              </p>
              <ul class="mt-4 space-y-3">
                <li
                  v-for="(item, i) in content.reasons.b2c"
                  :key="i"
                  class="flex items-start gap-3 text-ink/75"
                >
                  <Icon
                    name="material-symbols:check-circle-rounded"
                    class="mt-0.5 h-5 w-5 flex-none text-orange-500"
                  />
                  <span><AccentText :text="item" /></span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- 5. FAQ — centrée, sur beige soutenu (les deux dernières sections
           partageaient la même couleur : demande Éléonore). -->
      <section
        v-if="content.faq.length"
        v-reveal
        class="relative isolate overflow-hidden bg-paper-2"
      >
        <TentacleAccent
          side="left"
          name="tentacule-4-plein"
          class="absolute -left-24 bottom-4 -z-10 hidden w-[28rem] -rotate-6 text-teal-600/[0.05] lg:block"
        />
        <div class="mx-auto max-w-5xl px-4 py-20">
          <div class="mx-auto max-w-3xl">
            <SectionHeading title="Questions fréquentes" eyebrow="FAQ" align="center" />
            <div class="mt-10">
              <FaqAccordion :items="content.faq" />
            </div>
          </div>
        </div>
      </section>

      <!-- 6. CTA final → prise de RDV -->
      <section v-if="content.finalCta" v-reveal class="mx-auto max-w-6xl px-4 py-20">
        <CtaBlock
          :title="content.finalCta.title || 'Parlons-en'"
          :description="content.finalCta.body ?? undefined"
          :subtext="content.finalCta.subtext ?? undefined"
          cta-label="Réserver un échange"
          to="#rdv"
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
