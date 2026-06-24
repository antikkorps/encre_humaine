<script setup lang="ts">
// Confirmation de commande — retour de Stripe Checkout (docs/06 §Parcours).
// success_url = /boutique/confirmation?session_id={CHECKOUT_SESSION_ID}. La commande
// est enregistrée et l'email envoyé par le webhook Stripe (docs/05 §5.1) ; cette page
// se contente d'un accusé sobre. Pas indexée (page transactionnelle).
const route = useRoute();
const hasSession = computed(() => typeof route.query.session_id === "string");

const siteName = "L'Encre Humaine";
useSeoMeta({
  title: `Commande confirmée — ${siteName}`,
  robots: "noindex, nofollow",
});
</script>

<template>
  <section class="relative isolate mx-auto max-w-2xl overflow-hidden px-4 py-24">
    <!-- Filigrane poulpe discret qui affleure derrière la carte. -->
    <OctopusWatermark
      class="absolute -bottom-10 -right-10 -z-10 h-72 rotate-6 text-teal-700/[0.1]"
    />
    <div class="rounded-3xl border border-ink/5 bg-white p-10 text-center shadow-soft sm:p-12">
      <template v-if="hasSession">
        <p class="text-5xl" aria-hidden="true">🎉</p>
        <h1 class="mt-6 font-display text-3xl font-bold text-ink">Merci pour votre commande !</h1>
        <p class="mt-4 leading-relaxed text-ink/70">
          Votre paiement a bien été pris en compte. Vous allez recevoir un email de confirmation
          avec le récapitulatif de votre commande. Pensez à vérifier vos spams si besoin.
        </p>
      </template>
      <template v-else>
        <OctopusMark class="mx-auto h-14 w-14 text-teal-300" />
        <h1 class="mt-6 font-display text-3xl font-bold text-ink">Commande</h1>
        <p class="mt-4 leading-relaxed text-ink/70">
          Nous n'avons pas trouvé de commande à afficher. Si vous venez de payer, votre email de
          confirmation reste la référence.
        </p>
      </template>

      <NuxtLink
        to="/boutique"
        class="mt-8 inline-flex items-center gap-1.5 rounded-full bg-teal-700 px-7 py-3 font-semibold text-white shadow-soft transition-colors hover:bg-teal-800"
      >
        Retour à la boutique
      </NuxtLink>
    </div>
  </section>
</template>
