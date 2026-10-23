import { createHash } from "node:crypto";
import { type Database, diagnostics, lt } from "@encre/db";
import {
  type Answers,
  type B2bResult,
  type B2cResult,
  computeB2b,
  computeB2c,
} from "@encre/shared/diagnostics";
import type { DiagnosticKind } from "~/types/content";
// Import EXPLICITE (pas d'auto-import `utils/` côté Nitro), même source que la page.
import { diagnosticQuestions } from "~/utils/diagnostic-flow";

/**
 * Diagnostics côté serveur — docs/11-diagnostics.md. Le client n'est jamais
 * cru : les réponses sont filtrées sur le parcours, le résultat est recalculé,
 * et la réponse sensible B2C (« période très difficile ») n'est pas conservée.
 */
export const DIAGNOSTIC_RETENTION_MS = 3 * 365 * 24 * 60 * 60 * 1000; // ~3 ans, comme les leads

/** Questions dont la réponse n'est jamais enregistrée (seulement l'écran affiché). */
const NEVER_STORED = new Set(["difficulty"]);

export interface PreparedDiagnostic {
  answers: Answers;
  result: B2bResult | B2cResult;
}

/** Recalcule le résultat et ne garde que les réponses utiles du parcours. Lève si incomplet. */
export function prepareDiagnostic(kind: DiagnosticKind, raw: Answers): PreparedDiagnostic {
  const result = kind === "b2b" ? computeB2b(raw) : computeB2c(raw);
  const ids = diagnosticQuestions(kind, raw).map((q) => q.id);
  const answers = Object.fromEntries(
    ids
      .filter((id) => !NEVER_STORED.has(id) && raw[id] !== undefined)
      .map((id) => [id, raw[id] as number | string]),
  );
  return { answers, result };
}

/** Version du texte de consentement accepté : il vit dans Directus et peut changer. */
export function consentVersion(consentText: string): string {
  return createHash("sha256").update(consentText).digest("hex").slice(0, 12);
}

/** Type d'appareil pour les statistiques ; l'UA lui-même n'est jamais conservé. */
export function deviceFromUserAgent(
  userAgent: string | undefined | null,
): "mobile" | "desktop" | null {
  if (!userAgent) return null;
  return /Mobi|Android|iPhone|iPad/i.test(userAgent) ? "mobile" : "desktop";
}

/** Supprime les diagnostics plus vieux que la durée de conservation. `now` injectable (tests). */
export async function purgeOldDiagnostics(db: Database, now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - DIAGNOSTIC_RETENTION_MS);
  const deleted = await db
    .delete(diagnostics)
    .where(lt(diagnostics.createdAt, cutoff))
    .returning({ id: diagnostics.id });
  return deleted.length;
}
