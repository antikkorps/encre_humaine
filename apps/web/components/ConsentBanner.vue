<script setup lang="ts">
// Bandeau de consentement maison — docs/06-security.md §7.
// Non bloquant (region, pas de modale) : le site reste utilisable. Gate uniquement
// les contenus tiers (embed RDV, embeds Stripe). Umami cookieless = exempté.
const { decided, acceptThirdParty, refuseThirdParty } = useConsent();
</script>

<template>
  <ClientOnly>
    <section
      v-if="!decided"
      role="region"
      aria-label="Consentement aux contenus tiers"
      class="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-4xl rounded-2xl border border-ink/10 bg-paper/95 px-5 py-4 shadow-lift backdrop-blur sm:inset-x-4 sm:bottom-4"
    >
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="flex items-start gap-3 text-sm text-ink/80">
          <OctopusMark class="mt-0.5 hidden h-6 w-6 flex-none text-teal-600 sm:block" />
          <span>
            Ce site n'utilise aucun cookie de suivi. Certains contenus tiers
            (prise de rendez-vous, paiement) nécessitent votre accord pour se charger.
            <NuxtLink to="/confidentialite" class="text-teal-700 underline">En savoir plus</NuxtLink>.
          </span>
        </p>
        <div class="flex shrink-0 gap-2">
          <button
            type="button"
            class="rounded-full px-4 py-2 text-sm font-medium text-ink/70 transition-colors hover:bg-teal-50 hover:text-teal-700"
            @click="refuseThirdParty"
          >
            Continuer sans
          </button>
          <button
            type="button"
            class="rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-teal-800"
            @click="acceptThirdParty"
          >
            Autoriser les contenus tiers
          </button>
        </div>
      </div>
    </section>
  </ClientOnly>
</template>
