<script setup lang="ts">
// Un écran de question du diagnostic (docs/11-diagnostics.md §Parcours) :
// progression, libellé, réponses. Oui/En partie/Non et situations se valident au
// clic ; un menu se valide par « Continuer », qui exige un choix. Le titre reçoit
// le focus à chaque écran pour que clavier et lecteurs d'écran suivent.
import type { Question } from "@encre/shared/diagnostics";

const props = defineProps<{
  question: Question;
  label: string;
  options: string[];
  index: number;
  total: number;
  current?: number | string;
}>();
const emit = defineEmits<{ answer: [value: number | string]; back: [] }>();

const heading = ref<HTMLElement | null>(null);
const selected = ref<string>("");
const missing = ref(false);

watch(
  () => props.question.id,
  async () => {
    selected.value = typeof props.current === "string" ? props.current : "";
    missing.value = false;
    await nextTick();
    heading.value?.focus();
  },
  { immediate: true },
);

function submitSelect() {
  if (!selected.value) {
    missing.value = true;
    return;
  }
  emit("answer", selected.value);
}
</script>

<template>
  <div>
    <div class="h-1.5 overflow-hidden rounded-full bg-ink/10" aria-hidden="true">
      <div class="h-full bg-teal-700 transition-all" :style="{ width: `${((index + 1) / total) * 100}%` }" />
    </div>
    <p class="mt-2 text-sm text-ink/60" aria-live="polite">Question {{ index + 1 }} sur {{ total }}</p>

    <h2 ref="heading" tabindex="-1" class="mt-6 font-display text-2xl font-bold leading-snug text-ink outline-none">
      {{ label }}
    </h2>

    <form v-if="question.kind === 'select'" class="mt-6" @submit.prevent="submitSelect">
      <label :for="`q-${question.id}`" class="sr-only">{{ label }}</label>
      <select
        :id="`q-${question.id}`"
        v-model="selected"
        class="w-full rounded-2xl border border-ink/15 bg-white px-4 py-3.5 text-ink focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/30"
        :aria-invalid="missing"
        :aria-describedby="missing ? `q-${question.id}-err` : undefined"
      >
        <option value="" disabled>Choisir…</option>
        <option v-for="(key, i) in question.options" :key="key" :value="key">{{ options[i] }}</option>
      </select>
      <p v-if="missing" :id="`q-${question.id}-err`" class="mt-2 text-sm text-red-700" role="alert">
        Choisissez une réponse pour continuer.
      </p>
      <button
        type="submit"
        class="mt-5 inline-flex items-center gap-2 rounded-full bg-teal-800 px-6 py-3 font-semibold text-paper shadow-soft transition-colors hover:bg-teal-900"
      >
        Continuer <span aria-hidden="true">→</span>
      </button>
    </form>

    <div
      v-else
      class="mt-6 gap-3"
      :class="question.kind === 'yes_no' ? 'grid grid-cols-3' : 'flex flex-col'"
      role="group"
      :aria-label="label"
    >
      <button
        v-for="(option, i) in options"
        :key="i"
        type="button"
        class="rounded-2xl border bg-white px-4 py-4 font-medium text-ink transition-colors hover:border-teal-700"
        :class="[
          question.kind === 'yes_no' ? 'text-center' : 'text-left',
          current === i ? 'border-teal-700 ring-2 ring-teal-700/30' : 'border-ink/15',
        ]"
        :aria-pressed="current === i"
        @click="emit('answer', i)"
      >
        {{ option }}
      </button>
    </div>

    <button
      v-if="index > 0"
      type="button"
      class="mt-6 text-sm font-medium text-ink/60 underline underline-offset-4 hover:text-teal-700"
      @click="emit('back')"
    >
      Retour
    </button>
  </div>
</template>
