<script setup lang="ts">
// « Partager mon résultat » (B2C, cahier des charges §7) : LinkedIn ou copie du
// lien. Seuls un message générique et le lien du QUESTIONNAIRE partent — jamais
// un score, une réponse ni le lien du rapport.
import { DIAGNOSTIC_PATHS } from "@encre/shared/diagnostics";

const props = defineProps<{ text: string; label: string }>();

const pageUrl = `${useRequestURL().origin}${DIAGNOSTIC_PATHS.b2c}`;
const linkedin = computed(
  () => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`,
);
const copied = ref(false);

async function copy() {
  try {
    await navigator.clipboard.writeText(`${props.text} ${pageUrl}`);
    copied.value = true;
  } catch {
    copied.value = false;
  }
}
</script>

<template>
  <div role="group" :aria-label="label">
    <p class="text-sm font-semibold text-ink/70">{{ label }}</p>
    <div class="mt-2 flex flex-wrap items-center gap-3">
      <a
        :href="linkedin"
        target="_blank"
        rel="noopener"
        class="rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-teal-700 hover:text-teal-700"
      >
        LinkedIn
      </a>
      <button
        type="button"
        class="rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-teal-700 hover:text-teal-700"
        @click="copy"
      >
        Copier le lien
      </button>
      <span v-if="copied" class="text-sm text-teal-700" role="status">Lien copié</span>
    </div>
  </div>
</template>
