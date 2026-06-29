<script setup lang="ts">
// Page d'attente (« coming soon ») — servie par server/middleware/coming-soon.ts
// pour TOUTES les routes tant que COMING_SOON=true. Sans layout (pas de nav/footer
// → aucune fuite vers le site masqué). Seule action proposée : l'inscription
// newsletter (double opt-in, composant réutilisé tel quel).
definePageMeta({ layout: false });

useSeoMeta({
  title: "Bientôt en ligne — L'Encre Humaine",
  description:
    "Le site de L'Encre Humaine arrive très bientôt. Laissez votre e-mail pour être prévenu·e du lancement.",
  robots: "noindex, nofollow",
});

// Accès discret à l'espace d'édition : s'y connecter ouvre la prévisualisation
// du vrai site malgré la page d'attente (cf. server/utils/preview-session.ts).
const directusUrl = useRuntimeConfig().public.directusPublicUrl;
</script>

<template>
  <div class="relative flex min-h-screen flex-col overflow-hidden bg-paper text-ink antialiased">
    <!-- Accents décoratifs (encre) : tentacule en haut à gauche (ample en desktop),
         poulpe du hero (illustration détaillée) en bas à droite. -->
    <TentacleAccent
      name="tentacule-2-trait"
      class="pointer-events-none absolute -left-16 -top-12 h-64 w-64 text-teal-700/10 lg:-left-28 lg:-top-24 lg:h-[36rem] lg:w-[36rem]"
    />
    <OctopusWatermark
      class="pointer-events-none absolute -bottom-16 -right-16 h-[22rem] text-teal-700/[0.06] lg:h-[32rem]"
    />

    <main
      class="relative mx-auto flex w-full max-w-xl flex-1 flex-col justify-start px-6 py-12 sm:justify-center sm:py-16"
    >
      <div class="flex items-center gap-3 text-ink">
        <OctopusMark class="h-10 w-10 text-teal-700" />
        <span class="font-display text-xl font-semibold leading-none tracking-tight">
          L'Encre <span class="text-teal-700">Humaine</span>
        </span>
      </div>

      <h1 class="mt-8 font-display text-3xl font-semibold leading-tight text-ink sm:mt-10 sm:text-4xl">
        Le site arrive très bientôt.
      </h1>
      <p class="mt-3 text-lg text-ink/70 sm:mt-4">
        Conseil RH &amp; accompagnement, et bientôt une boutique de serious games.
        Nous préparons tout ça avec soin.
      </p>

      <div class="mt-8 rounded-2xl border border-ink/10 bg-white/60 p-6 shadow-soft">
        <p class="font-display text-lg font-semibold text-ink">Prévenez-moi du lancement</p>
        <p class="mt-1 text-sm text-ink/65">
          Laissez votre e-mail : vous serez parmi les premier·e·s informé·e·s.
        </p>
        <div class="mt-5">
          <NewsletterForm />
        </div>
      </div>

      <p class="mt-8 text-sm text-ink/55">
        Une question dès maintenant&nbsp;?
        <a href="mailto:contact@encrehumaine.fr" class="font-medium text-teal-700 hover:underline">
          contact@encrehumaine.fr
        </a>
      </p>

      <!-- Accès édition, volontairement discret (utile à l'équipe, pas au public). -->
      <a
        v-if="directusUrl"
        :href="directusUrl"
        class="mt-10 inline-block text-xs text-ink/25 transition-colors hover:text-teal-700"
      >
        Espace édition
      </a>
    </main>
  </div>
</template>
