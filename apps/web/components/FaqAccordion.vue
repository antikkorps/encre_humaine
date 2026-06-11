<script setup lang="ts">
// FAQ en accordéon — docs/02-content-model.md §5 (`faq_items`).
// Primitive Reka UI (clavier + ARIA natifs). Se masque si vide (docs/00-global §États).
import type { FaqItem } from "~/types/content";

defineProps<{ items: FaqItem[] }>();
</script>

<template>
  <AccordionRoot
    v-if="items.length"
    type="single"
    :collapsible="true"
    class="divide-y divide-teal-100 rounded-2xl border border-teal-100 bg-white"
  >
    <AccordionItem
      v-for="(item, i) in items"
      :key="i"
      :value="String(i)"
      class="px-5"
    >
      <AccordionHeader as="h3">
        <AccordionTrigger
          class="group flex w-full items-center justify-between gap-4 py-4 text-left font-medium text-teal-900"
        >
          <span>{{ item.question }}</span>
          <span
            aria-hidden="true"
            class="shrink-0 text-teal-500 transition-transform group-data-[state=open]:rotate-45"
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
