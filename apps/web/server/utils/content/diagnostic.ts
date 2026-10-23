import { readSingleton } from "@directus/sdk";
import {
  B2B_TEXTS,
  B2C_TEXTS,
  type DiagnosticTexts,
  mergeTexts,
  type RawDiagnosticTexts,
} from "@encre/shared/diagnostics";
import type { DiagnosticContent, DiagnosticKind } from "~/types/content";
import { safeHref } from "./_shared";

/**
 * Contenu d'un diagnostic — docs/11-diagnostics.md. Textes du singleton Directus
 * fusionnés clé par clé avec la référence du cahier des charges, plus l'agenda
 * du public concerné (organisations pour le B2B, particuliers pour le B2C).
 */
export type { DiagnosticContent, DiagnosticKind };

export interface RawBookingSettings {
  booking_url?: string | null;
  booking_url_org?: string | null;
  booking_url_b2c?: string | null;
}

const BASE_TEXTS: Record<DiagnosticKind, DiagnosticTexts> = { b2b: B2B_TEXTS, b2c: B2C_TEXTS };

export function mapDiagnosticContent(
  kind: DiagnosticKind,
  raw: RawDiagnosticTexts | null,
  settings: RawBookingSettings,
): DiagnosticContent {
  const audienceUrl = kind === "b2b" ? settings.booking_url_org : settings.booking_url_b2c;
  return {
    kind,
    texts: mergeTexts(BASE_TEXTS[kind], raw ?? {}),
    bookingUrl: safeHref(audienceUrl) || safeHref(settings.booking_url),
  };
}

/** Charge les textes d'un diagnostic (Directus, lecture seule) + les agendas. */
export async function loadDiagnosticContent(kind: DiagnosticKind): Promise<DiagnosticContent> {
  const client = directusServer();
  const [raw, settings] = await Promise.all([
    client.request(readSingleton(`diagnostic_${kind}`)),
    client.request(
      readSingleton("site_settings", {
        fields: ["booking_url", "booking_url_org", "booking_url_b2c"],
      }),
    ),
  ]);
  return mapDiagnosticContent(
    kind,
    raw as unknown as RawDiagnosticTexts,
    settings as unknown as RawBookingSettings,
  );
}
