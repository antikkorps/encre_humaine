/**
 * Vérification serveur de Cloudflare Turnstile — docs/06-security.md §3.
 * La validation côté client ne fait JAMAIS foi : tout token est revérifié ici
 * via siteverify avec le secret (strictement serveur).
 */
const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface SiteVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
}

/**
 * Renvoie `true` si le token Turnstile est valide. `remoteIp` (optionnel) renforce
 * la vérification. Toute erreur réseau/HTTP est traitée comme un échec (fail-closed).
 */
export async function verifyTurnstile(token: string, remoteIp?: string): Promise<boolean> {
  const { turnstileSecretKey } = useRuntimeConfig();
  if (!turnstileSecretKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Turnstile non configuré (TURNSTILE_SECRET_KEY).",
    });
  }

  const body = new URLSearchParams({ secret: turnstileSecretKey, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    // timeout court + pas de retry : siteverify lent/injoignable ⇒ échec rapide
    // (fail-closed) plutôt que de laisser pendre la soumission du formulaire.
    const res = await $fetch<SiteVerifyResponse>(SITEVERIFY_URL, {
      method: "POST",
      body,
      timeout: 5000,
      retry: 0,
    });
    return res.success === true;
  } catch {
    return false; // fail-closed : pas de validation en cas d'incident
  }
}
