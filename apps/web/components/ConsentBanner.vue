<script setup lang="ts">
// Bandeau de consentement maison — docs/06-security.md §7.
// Non bloquant (region, pas de modale) : le site reste utilisable. Gate uniquement
// les contenus tiers (Calendly, embeds Stripe). Umami cookieless = exempté.
const { decided, acceptThirdParty, refuseThirdParty } = useConsent();
</script>

<template>
  <ClientOnly>
    <section
      v-if="!decided"
      role="region"
      aria-label="Consentement aux contenus tiers"
      class="fixed inset-x-0 bottom-0 z-50 border-t border-teal-100 bg-white/95 px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur"
    >
      <div class="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-sm text-teal-800">
          Ce site n'utilise aucun cookie de suivi. Certains contenus tiers
          (prise de RDV Calendly, paiement Stripe) nécessitent votre accord pour se charger.
          <NuxtLink to="/confidentialite" class="underline">En savoir plus</NuxtLink>.
        </p>
        <div class="flex shrink-0 gap-2">
          <button
            type="button"
            class="rounded-full px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50"
            @click="refuseThirdParty"
          >
            Continuer sans
          </button>
          <button
            type="button"
            class="rounded-full bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
            @click="acceptThirdParty"
          >
            Autoriser les contenus tiers
          </button>
        </div>
      </div>
    </section>
  </ClientOnly>
</template>
