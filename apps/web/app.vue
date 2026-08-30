<script setup lang="ts">
// Défauts SEO globaux (les pages surchargent title/description/ogImage). Le
// titre est servi tel quel : les pages posent déjà le suffixe « — L'Encre
// Humaine », d'où le `titleTemplate: "%s"` de `nuxt.config` qui neutralise le
// gabarit de nuxt-seo-utils. Org/WebSite schema.org = config `schemaOrg`.
//
// `ogImage` ne couvre ICI que les pages sans SEO Directus (laboratoire, liste
// « tous », pages légales, erreurs) : pour les pages CMS c'est `mapSeo` qui
// garantit une image, car une page qui passe `ogImage: undefined` ÉCRASE ce
// défaut par dédup unhead au lieu de le laisser passer.
useSeoMeta({
  ogSiteName: "L'Encre Humaine",
  ogLocale: "fr_FR",
  ogImage: DEFAULT_OG_IMAGE,
  twitterCard: "summary_large_image",
});
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
