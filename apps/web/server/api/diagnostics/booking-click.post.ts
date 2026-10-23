import { and, diagnostics, eq, isNull } from "@encre/db";

/**
 * Premier clic sur le bouton de rendez-vous d'un rapport — mesure prévue par le
 * cahier des charges (§9). Silencieux : jeton inconnu ou déjà compté → 204.
 */
export default defineEventHandler(async (event) => {
  enforceRateLimit(event, "diagnostic-booking", { limit: 20, windowMs: 60_000 });
  const body = await readBody<{ token?: unknown }>(event);
  const token = typeof body?.token === "string" ? body.token : "";
  if (/^[\w-]{20,128}$/.test(token)) {
    await serverDb()
      .update(diagnostics)
      .set({ bookingClickedAt: new Date() })
      .where(
        and(
          eq(diagnostics.reportTokenHash, hashToken(token)),
          isNull(diagnostics.bookingClickedAt),
        ),
      );
  }
  setResponseStatus(event, 204);
  return null;
});
