<script setup lang="ts">
// Déroulé d'un diagnostic (docs/11-diagnostics.md §Parcours). L'état vit en
// mémoire seulement (pas de stockage navigateur, décision du 2026-10-23) : un
// rechargement repart du début ; une fois débloqué, le rapport se retrouve par
// son lien. Le calcul est celui de `@encre/shared`, refait par le serveur.
import {
  type Answers,
  type B2bResult,
  type B2cResult,
  CARE_TRIGGER,
  computeB2b,
  computeB2c,
  questionLabel,
  setB2cAnswer,
} from "@encre/shared/diagnostics";
import type { DiagnosticContent } from "~/types/content";

const props = defineProps<{ content: DiagnosticContent }>();
const track = useTrack();

const kind = computed(() => props.content.kind);
const texts = computed(() => props.content.texts);
const answers = ref<Answers>({});
const index = ref(0);
const step = ref<"question" | "care" | "result">("question");
const result = ref<B2bResult | B2cResult | null>(null);

const questions = computed(() => diagnosticQuestions(kind.value, answers.value));
const question = computed(() => questions.value[index.value]);
const label = computed(() =>
  question.value
    ? questionLabel(texts.value, question.value.id, String(answers.value.profile ?? ""))
    : "",
);

function record(id: string, value: number | string) {
  answers.value =
    kind.value === "b2c"
      ? setB2cAnswer(answers.value, id, value)
      : { ...answers.value, [id]: value };
}

function onAnswer(value: number | string) {
  const id = question.value?.id;
  if (!id) return;
  if (index.value === 0 && answers.value[id] === undefined)
    track("diagnostic_start", { kind: kind.value });
  record(id, value);
  // Réponse sensible : écran bienveillant, et aucune trace autre qu'un compteur anonyme.
  if (id === CARE_TRIGGER.id && value === CARE_TRIGGER.value) {
    track("diagnostic_care_screen");
    step.value = "care";
    return;
  }
  next();
}

function next() {
  step.value = "question";
  if (index.value < questions.value.length - 1) {
    index.value += 1;
    return;
  }
  result.value = kind.value === "b2b" ? computeB2b(answers.value) : computeB2c(answers.value);
  step.value = "result";
  track("diagnostic_complete", { kind: kind.value });
}

function back() {
  if (index.value > 0) index.value -= 1;
}

function restart() {
  answers.value = {};
  index.value = 0;
  result.value = null;
  step.value = "question";
}

watch(step, () => {
  if (import.meta.client) window.scrollTo({ top: 0 });
});
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-12 sm:py-16">
    <template v-if="step === 'question' && question">
      <header v-if="index === 0" class="mb-10">
        <h1 class="font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
          {{ texts.title }}
        </h1>
        <p class="mt-4 text-lg leading-relaxed text-ink/70">{{ texts.intro }}</p>
      </header>
      <DiagnosticQuestion
        :question="question"
        :label="label"
        :options="texts.questions[question.id]?.options ?? []"
        :index="index"
        :total="questions.length"
        :current="answers[question.id]"
        @answer="onAnswer"
        @back="back"
      />
    </template>

    <section v-else-if="step === 'care'" aria-labelledby="care-title">
      <h2 id="care-title" class="font-display text-3xl font-bold text-ink">
        {{ texts.messages.care_title }}
      </h2>
      <p class="mt-4 leading-relaxed text-ink/75">{{ texts.messages.care_body }}</p>
      <div class="mt-8 flex flex-wrap items-center gap-4">
        <button
          type="button"
          class="rounded-full bg-teal-800 px-6 py-3 font-semibold text-paper shadow-soft hover:bg-teal-900"
          @click="next"
        >
          {{ texts.messages.care_continue }}
        </button>
        <NuxtLink to="/" class="font-medium text-ink/70 underline underline-offset-4 hover:text-teal-700">
          {{ texts.messages.care_later }}
        </NuxtLink>
      </div>
    </section>

    <template v-else-if="step === 'result' && result">
      <DiagnosticResult :content="content" :answers="answers" :result="result" />
      <button
        type="button"
        class="mt-10 text-sm font-medium text-ink/60 underline underline-offset-4 hover:text-teal-700"
        @click="restart"
      >
        Recommencer
      </button>
    </template>
  </div>
</template>
