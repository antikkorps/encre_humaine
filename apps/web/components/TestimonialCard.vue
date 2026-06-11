<script setup lang="ts">
// Carte témoignage — docs/02-content-model.md §5 (`testimonials`).
// Les sections témoignage se masquent si vides → ce composant suppose un item présent.
import type { TestimonialItem } from "~/types/content";

const props = defineProps<{ testimonial: TestimonialItem }>();

// Ligne d'attribution : « Prénom Nom, fonction — entreprise ».
const attribution = computed(() => {
  const t = props.testimonial;
  const role = [t.authorTitle, t.company].filter(Boolean).join(" — ");
  return role ? `${t.authorName}, ${role}` : t.authorName;
});
</script>

<template>
  <figure class="flex h-full flex-col rounded-2xl border border-teal-100 bg-white p-6">
    <blockquote class="flex-1 text-teal-800">
      <p class="before:content-['«_'] after:content-['_»']">{{ testimonial.quote }}</p>
    </blockquote>
    <figcaption class="mt-4 text-sm">
      <span class="font-semibold text-teal-900">{{ attribution }}</span>
      <span v-if="testimonial.context" class="mt-1 block text-teal-600">
        {{ testimonial.context }}
      </span>
    </figcaption>
  </figure>
</template>
