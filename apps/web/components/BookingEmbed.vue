<script setup lang="ts">
// Embed de prise de RDV — docs/06-security.md §7, docs/09-contact.md.
// Provider : **Cal.com** (isolé ici ; le reste de l'app ne connaît qu'une URL de
// réservation, cf. utils/booking.ts). Chargé UNIQUEMENT après consentement tiers :
// tant qu'il n'est pas donné, un placeholder propose de l'autoriser (aucun appel
// à Cal.com, aucun cookie avant). Si on change un jour de provider, seul ce
// composant change — pas le contrat, l'env ni le schéma.
type CalFn = (...args: unknown[]) => void;
interface CalQueue extends CalFn {
  loaded?: boolean;
  ns?: Record<string, unknown>;
  q?: unknown[][];
}
declare global {
  interface Window {
    Cal?: CalQueue;
  }
}

const props = defineProps<{ url: string; intro?: string }>();
const { thirdParty, acceptThirdParty } = useConsent();

const container = ref<HTMLElement | null>(null);
const target = computed(() => parseBookingUrl(props.url));
let initialised = false;

/** Bootstrap de la file Cal (charge embed.js au 1er appel), façon snippet officiel. */
function bootstrapCal(embedSrc: string): CalQueue {
  if (window.Cal) return window.Cal;
  const cal = ((...args: unknown[]) => {
    const c = window.Cal as CalQueue;
    if (!c.loaded) {
      c.loaded = true;
      c.ns = {};
      c.q = c.q ?? [];
      const s = document.createElement("script");
      s.src = embedSrc;
      s.async = true;
      document.head.appendChild(s);
    }
    (c.q as unknown[][]).push(args);
  }) as CalQueue;
  cal.q = [];
  window.Cal = cal;
  return cal;
}

function mountWidget() {
  if (initialised || !thirdParty.value || !target.value) return;
  // Le conteneur n'est pas toujours dans le DOM au 1er appel (ClientOnly +
  // portail de la modale qui se monte) → on réessaie à la frame suivante tant
  // qu'il manque, plutôt que d'abandonner (sinon calendrier vide si le
  // consentement est déjà accordé à l'ouverture).
  if (!container.value) {
    requestAnimationFrame(mountWidget);
    return;
  }
  const cal = bootstrapCal(target.value.embedSrc);
  cal("init", { origin: target.value.origin });
  cal("inline", {
    elementOrSelector: container.value,
    calLink: target.value.calLink,
    config: { layout: "month_view" },
  });
  initialised = true;
}

watch(thirdParty, (granted) => {
  if (granted) mountWidget();
});

onMounted(() => {
  if (thirdParty.value) mountWidget();
});
</script>

<template>
  <div>
    <p v-if="intro" class="mb-4 text-ink/70">{{ intro }}</p>

    <ClientOnly>
      <div v-if="thirdParty" ref="container" style="min-width: 320px; height: 700px" />

      <div
        v-else
        class="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-teal-300 bg-teal-50 px-6 py-12 text-center"
      >
        <OctopusMark class="h-12 w-12 text-teal-400" />
        <p class="max-w-md text-sm text-ink/70">
          La prise de rendez-vous est fournie par un service tiers.
          Autorisez son chargement pour afficher le calendrier.
        </p>
        <button
          type="button"
          class="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-teal-800"
          @click="acceptThirdParty"
        >
          Autoriser et afficher le calendrier
        </button>
        <a :href="url" target="_blank" rel="noopener" class="text-sm text-teal-700 underline">
          Ou ouvrir la page de réservation dans un nouvel onglet
        </a>
      </div>
    </ClientOnly>
  </div>
</template>
