<script setup lang="ts">
// FAQ en accordéon — docs/02-content-model.md §5 (`faq_items`).
// Primitive Reka UI (clavier + ARIA natifs). Se masque si vide (docs/00-global §États).
// `unmount-on-hide=false` : les réponses repliées restent dans le HTML (masquées
// via `hidden="until-found"`), sinon moteurs et IA ne voient que les questions.
import type { FaqItem } from "~/types/content";

const props = defineProps<{ items: FaqItem[] }>();

// Balisage FAQPage porté par le composant : toute page qui affiche une FAQ est
// balisée d'office, sans rien à répéter page par page. Instantané au montage :
// la FAQ est rendue côté serveur et le composant est remonté à chaque page.
if (props.items.length) {
  useSchemaOrg([
    defineWebPage({ "@type": ["WebPage", "FAQPage"] }),
    ...props.items.map((item) =>
      defineQuestion({ name: stripAccent(item.question), acceptedAnswer: item.answer }),
    ),
  ]);
}
</script>

<template>
  <AccordionRoot
    v-if="items.length"
    type="single"
    :collapsible="true"
    :unmount-on-hide="false"
    class="divide-y divide-ink/5 rounded-3xl border border-ink/5 bg-white shadow-soft"
  >
    <AccordionItem
      v-for="(item, i) in items"
      :key="i"
      :value="String(i)"
      class="px-6"
    >
      <AccordionHeader as="h3">
        <AccordionTrigger
          class="group flex w-full items-center justify-between gap-4 py-5 text-left font-display text-lg font-semibold text-ink transition-colors hover:text-teal-700"
        >
          <span><AccentText :text="item.question" /></span>
          <span
            aria-hidden="true"
            class="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-teal-50 text-lg text-teal-700 transition-transform group-data-[state=open]:rotate-45"
          >
            +
          </span>
        </AccordionTrigger>
      </AccordionHeader>
      <AccordionContent
        class="overflow-hidden data-[state=closed]:animate-none"
      >
        <RichText :html="item.answer" class="pb-4" />
      </AccordionContent>
    </AccordionItem>
  </AccordionRoot>
</template>
