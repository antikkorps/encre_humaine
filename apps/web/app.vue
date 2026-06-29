<script setup lang="ts">
// Défauts SEO globaux (les pages surchargent title/description/ogImage). On
// n'ajoute PAS de titleTemplate : les pages posent déjà le suffixe « — L'Encre
// Humaine » dans leur title. Org/WebSite schema.org = config `schemaOrg`.
useSeoMeta({
  ogSiteName: "L'Encre Humaine",
  ogLocale: "fr_FR",
  twitterCard: "summary_large_image",
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
