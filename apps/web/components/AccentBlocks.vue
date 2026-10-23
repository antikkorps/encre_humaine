<script setup lang="ts">
// Texte simple multi-paragraphes de Directus rendu en VRAIS blocs HTML : `<p>`
// par paragraphe et `<ul>` pour les lignes « • » (cf. `utils/text-blocks.ts`).
// Chaque bloc passe ensuite par `AccentText` (convention `**…**`). À utiliser à
// la place d'un `<p><AccentText/></p>` dès qu'un champ peut contenir des puces.
const props = defineProps<{ text?: string | null; tone?: "light" | "dark" }>();

const blocks = computed(() => parseTextBlocks(props.text ?? ""));
</script>

<template>
  <div class="space-y-4">
    <template v-for="(block, i) in blocks" :key="i">
      <ul v-if="block.kind === 'ul'" class="list-disc space-y-1.5 pl-5 marker:text-orange-500">
        <li v-for="(item, j) in block.items" :key="j"><AccentText :text="item" :tone="tone" /></li>
      </ul>
      <p v-else><AccentText :text="block.text" :tone="tone" /></p>
    </template>
  </div>
</template>
