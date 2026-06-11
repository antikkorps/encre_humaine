<script setup lang="ts">
/**
 * Rendu typographique du WYSIWYG Directus — docs/00-global.md §Composants.
 *
 * ⚠️ Contrat de sécurité : le HTML reçu DOIT être assaini en amont, au moment du
 * fetch Directus côté serveur (phase 1, docs/06-security.md §1). Ce composant est
 * la *surface de rendu* (styles cohérents) ; il n'assainit pas lui-même. Ne jamais
 * lui passer du HTML d'origine utilisateur non filtré.
 */
withDefaults(
  defineProps<{
    html?: string;
    /** Balise conteneur (article par défaut). */
    as?: string;
  }>(),
  { as: "div" },
);
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <component :is="as" v-if="html" class="rich-text" v-html="html" />
</template>
