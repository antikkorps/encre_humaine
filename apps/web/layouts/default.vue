<template>
  <div class="min-h-screen flex flex-col bg-paper text-ink antialiased">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-teal-700 focus:px-3 focus:py-2 focus:text-white"
    >
      Aller au contenu
    </a>

    <AppHeader />

    <main id="main" class="flex-1">
      <slot />
    </main>

    <AppFooter />

    <!-- Bandeau de consentement global (gate des embeds tiers) — docs/06 §7. -->
    <ConsentBanner />
  </div>
</template>
