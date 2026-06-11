/**
 * Cloudflare Turnstile (anti-bot) — docs/06-security.md §3.
 * Rendu explicite dans un conteneur ; le token obtenu accompagne la soumission
 * du formulaire et est revérifié côté serveur (siteverify). Fonction de sécurité
 * → exemptée du consentement tiers. Le domaine est autorisé par la CSP (docs/06 §6).
 *
 * Sans `TURNSTILE_SITE_KEY` (dev), le widget ne se rend pas : `ready` reste faux
 * et le formulaire signale que l'anti-bot est indisponible (pas de token factice).
 */
import type { Ref } from "vue";

interface TurnstileApi {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
      theme?: "light" | "dark" | "auto";
    },
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Échec du chargement de Turnstile"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export function useTurnstile(container: Ref<HTMLElement | null>) {
  const token = ref("");
  const ready = ref(false);
  const failed = ref(false);
  const siteKey = useRuntimeConfig().public.turnstileSiteKey as string;
  let widgetId: string | undefined;

  function reset() {
    token.value = "";
    if (widgetId && window.turnstile) window.turnstile.reset(widgetId);
  }

  onMounted(async () => {
    if (!siteKey) return; // dev sans clé : anti-bot indisponible, on le signale.
    try {
      await loadScript();
      if (!container.value || !window.turnstile) return;
      widgetId = window.turnstile.render(container.value, {
        sitekey: siteKey,
        theme: "auto",
        callback: (t) => {
          token.value = t;
        },
        "expired-callback": () => {
          token.value = "";
        },
        "error-callback": () => {
          token.value = "";
          failed.value = true;
        },
      });
      ready.value = true;
    } catch {
      failed.value = true;
    }
  });

  onBeforeUnmount(() => {
    if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
  });

  return { token, ready, failed, siteKey, reset };
}
