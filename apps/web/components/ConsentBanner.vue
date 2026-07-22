<script setup lang="ts">
// Bandeau de consentement maison — docs/06-security.md §7.
// Non bloquant (region, pas de modale) : le site reste utilisable. Gate uniquement
// les contenus tiers (embed RDV, embeds Stripe). Umami cookieless = exempté.
//
// Habillage « poulpe » (demande Éléonore) : ton chaleureux, mascotte à la loupe,
// 3 choix explicites (tout accepter / régler / refuser l'optionnel) + lien vers la
// politique de confidentialité. Un panneau de réglages fin détaille les catégories.
// Une fois un choix fait, un petit bouton flottant en bas à gauche permet de
// rouvrir le bandeau à tout moment (rappel du consentement, exigence RGPD).
import cookieOctopus from "~/assets/cookies/cookies.webp";

const {
  visible,
  thirdParty,
  acceptThirdParty,
  refuseThirdParty,
  savePreferences,
  openPreferences,
} = useConsent();

// Vue courante du bandeau : présentation ou réglages fins.
const view = ref<"intro" | "settings">("intro");
// État local du toggle « optionnel » dans le panneau (init depuis le cookie).
const allowOptional = ref(thirdParty.value);

function openSettings() {
  allowOptional.value = thirdParty.value;
  view.value = "settings";
}

function save() {
  savePreferences(allowOptional.value);
  view.value = "intro";
}

// Rouvrir depuis le widget flottant : on repart toujours de la présentation.
function reopen() {
  view.value = "intro";
  openPreferences();
}
</script>

<template>
  <ClientOnly>
    <!-- ============================ Bandeau ============================ -->
    <section
      v-if="visible"
      role="region"
      aria-label="Contrôle des cookies"
      class="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl overflow-hidden rounded-3xl border border-ink/10 bg-paper/95 shadow-lift backdrop-blur sm:inset-x-4 sm:bottom-4"
    >
      <!-- Vue 1 — présentation. Mascotte à droite (grande, halo doré), texte à
           gauche, puis barre d'actions : refus à l'extrême gauche, réglage +
           acceptation groupés à droite (l'acceptation, primaire, en dernier). -->
      <div v-if="view === 'intro'" class="p-5 sm:p-7">
        <div class="flex flex-col gap-5 sm:flex-row-reverse sm:items-center sm:gap-7">
          <div class="relative mx-auto flex-none sm:mx-0">
            <span
              aria-hidden="true"
              class="absolute inset-0 -z-10 m-auto h-32 w-32 rounded-full bg-sand-300/30 blur-2xl sm:h-44 sm:w-44"
            ></span>
            <img
              :src="cookieOctopus"
              alt=""
              aria-hidden="true"
              width="220"
              height="220"
              class="h-40 w-40 select-none object-contain sm:h-52 sm:w-52"
            />
          </div>
          <div class="min-w-0">
            <h2 class="font-display text-xl font-bold text-ink">
              Contrôle des cookies • autorisation d'embarquement 🍪
            </h2>
            <div class="mt-2.5 space-y-2 text-sm leading-relaxed text-ink/75">
              <p>Notre poulpe technique a détecté quelques cookies à bord.</p>
              <p>
                Pas d'inquiétude : ils ne sont pas là pour observer vos tentacules (ni votre
                réserve de biscuits). Certains sont nécessaires au bon fonctionnement du site,
                d'autres nous aident à améliorer votre expérience.
              </p>
              <p>À vous de choisir lesquels peuvent embarquer.</p>
            </div>
            <NuxtLink
              to="/confidentialite"
              class="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 underline decoration-teal-700/40 underline-offset-2 transition-colors hover:text-teal-800"
            >
              <Icon name="material-symbols:visibility" class="h-4 w-4" />
              Lire la politique de confidentialité
            </NuxtLink>
          </div>
        </div>

        <div
          class="mt-6 flex flex-col gap-3 border-t border-ink/10 pt-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <button
            type="button"
            class="order-last rounded-full px-4 py-2.5 text-sm font-medium text-ink/60 whitespace-nowrap transition-colors hover:bg-ink/5 hover:text-ink sm:order-none"
            @click="refuseThirdParty"
          >
            Je poursuis sans cookies optionnels
          </button>
          <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <button
              type="button"
              class="whitespace-nowrap rounded-full bg-orange-400 px-5 py-2.5 text-sm font-semibold text-ink shadow-soft transition-colors hover:bg-sand-500"
              @click="openSettings"
            >
              Je règle les tentacules 🐙
            </button>
            <button
              type="button"
              class="whitespace-nowrap rounded-full bg-teal-700 px-6 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-teal-800"
              @click="acceptThirdParty"
            >
              J'autorise l'embarquement
            </button>
          </div>
        </div>
      </div>

      <!-- Vue 2 — réglages fins par catégorie -->
      <div v-else class="p-5 sm:p-6">
        <h2 class="font-display text-lg font-bold text-ink">Je règle les tentacules 🐙</h2>
        <p class="mt-1 text-sm text-ink/70">Choisissez ce qui peut embarquer.</p>

        <ul class="mt-4 space-y-3">
          <li class="flex items-start gap-3 rounded-2xl border border-ink/10 bg-white/60 p-4">
            <span
              aria-hidden="true"
              class="mt-0.5 grid h-6 w-11 flex-none place-items-center rounded-full bg-teal-700/90 text-xs font-semibold text-white"
              >Actif</span
            >
            <div>
              <p class="text-sm font-semibold text-ink">Cookies nécessaires</p>
              <p class="mt-0.5 text-sm text-ink/65">
                Indispensables au bon fonctionnement du site (sécurité, mémorisation de votre
                choix). Toujours actifs, sans suivi.
              </p>
            </div>
          </li>
          <li class="flex items-start gap-3 rounded-2xl border border-ink/10 bg-white/60 p-4">
            <label class="mt-0.5 inline-flex flex-none cursor-pointer items-center">
              <input v-model="allowOptional" type="checkbox" class="peer sr-only" />
              <span
                aria-hidden="true"
                class="relative h-6 w-11 rounded-full bg-ink/20 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-teal-700 peer-checked:after:translate-x-5"
              ></span>
              <span class="sr-only">Activer les cookies optionnels</span>
            </label>
            <div>
              <p class="text-sm font-semibold text-ink">Contenus optionnels &amp; confort</p>
              <p class="mt-0.5 text-sm text-ink/65">
                Chargement des contenus tiers (prise de rendez-vous, paiement) et petits réglages
                qui améliorent votre expérience.
              </p>
            </div>
          </li>
        </ul>

        <div class="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <button
            type="button"
            class="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-teal-800"
            @click="save"
          >
            Enregistrer mes choix
          </button>
          <button
            type="button"
            class="rounded-full px-5 py-2.5 text-sm font-medium text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink"
            @click="view = 'intro'"
          >
            Retour
          </button>
        </div>
      </div>
    </section>

    <!-- ====================== Widget flottant (rappel) ====================== -->
    <!-- Toujours accessible en bas à gauche une fois un choix fait — libellé au survol. -->
    <div v-else class="group fixed bottom-3 left-3 z-40 sm:bottom-4 sm:left-4">
      <button
        type="button"
        aria-label="Gérez vos préférences en matière de cookies et données personnelles"
        class="grid h-12 w-12 place-items-center rounded-full border border-ink/10 bg-paper/95 text-teal-700 shadow-lift backdrop-blur transition-transform hover:-translate-y-0.5"
        @click="reopen"
      >
        <OctopusMark class="h-6 w-6" />
      </button>
      <span
        aria-hidden="true"
        class="pointer-events-none absolute bottom-1/2 left-14 w-max max-w-[70vw] translate-y-1/2 rounded-xl bg-ink px-3 py-2 text-xs font-medium text-paper opacity-0 shadow-lift transition-opacity duration-150 group-hover:opacity-100"
      >
        Gérez vos préférences en matière de cookies et données personnelles
      </span>
    </div>
  </ClientOnly>
</template>
