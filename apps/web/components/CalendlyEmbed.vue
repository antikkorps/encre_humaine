<script setup lang="ts">
// Embed Calendly — docs/06-security.md §7, docs/09-contact.md.
// Chargé UNIQUEMENT après consentement tiers. Tant qu'il n'est pas donné : un
// placeholder propose de l'autoriser (aucun appel à Calendly, aucun cookie avant).
interface CalendlyApi {
  initInlineWidget: (opts: { url: string; parentElement: HTMLElement }) => void;
}
declare global {
  interface Window {
    Calendly?: CalendlyApi;
  }
}

const props = defineProps<{ url: string; intro?: string }>();
const { thirdParty, acceptThirdParty } = useConsent();

const WIDGET_SRC = "https://assets.calendly.com/assets/external/widget.js";
const container = ref<HTMLElement | null>(null);
let initialised = false;

function ensureScript(): Promise<void> {
  if (window.Calendly) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${WIDGET_SRC}"]`);
  if (existing) {
    return new Promise((resolve) =>
      existing.addEventListener("load", () => resolve(), { once: true }),
    );
  }
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = WIDGET_SRC;
    s.async = true;
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

async function mountWidget() {
  if (initialised || !container.value) return;
  await ensureScript();
  if (!window.Calendly || !container.value) return;
  window.Calendly.initInlineWidget({ url: props.url, parentElement: container.value });
  initialised = true;
}

watch(thirdParty, (granted) => {
  if (granted) nextTick(mountWidget);
});

onMounted(() => {
  if (thirdParty.value) mountWidget();
});
</script>

<template>
  <div>
    <p v-if="intro" class="mb-4 text-teal-700">{{ intro }}</p>

    <ClientOnly>
      <div v-if="thirdParty" ref="container" style="min-width: 320px; height: 700px" />

      <div
        v-else
        class="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-teal-200 bg-teal-50 px-6 py-12 text-center"
      >
        <p class="max-w-md text-sm text-teal-700">
          La prise de rendez-vous est fournie par Calendly (service tiers).
          Autorisez son chargement pour afficher le calendrier.
        </p>
        <button
          type="button"
          class="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800"
          @click="acceptThirdParty"
        >
          Autoriser et afficher le calendrier
        </button>
        <a :href="url" target="_blank" rel="noopener" class="text-sm text-teal-600 underline">
          Ou ouvrir Calendly dans un nouvel onglet
        </a>
      </div>
    </ClientOnly>
  </div>
</template>
