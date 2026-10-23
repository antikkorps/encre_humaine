// Données structurées (JSON-LD) — audit SEO Éléonore du 2026-10-22 : le prix
// « à partir de » des offres alimente le balisage `Service`, et les textes
// envoyés aux moteurs ne doivent pas garder la convention `**…**`.
import { describe, expect, it } from "vitest";
import { stripAccent } from "~/utils/accent";
import { parseStartingPrice } from "~/utils/structured-data";

describe("parseStartingPrice", () => {
  it.each([
    ["Tarif de l’audit RH : à partir de 2 000 €", 2000],
    ["Tarif : à partir de 4 000 €", 4000],
    ["900€", 900],
    ["600 €", 600],
    ["À partir de 1 250,50 €", 1250.5],
    ["À partir de 1.250 €", 1250],
    ["De 500 à 900 €", 500],
  ])("lit le montant de « %s »", (label, expected) => {
    expect(parseStartingPrice(label)).toBe(expected);
  });

  it.each([
    ["Tarif : sur devis"],
    ["Sur devis (à partir de 2 000 €)"],
    ["Durée : 6 mois"],
    [""],
    [null],
  ])("renvoie null sans montant (%s)", (label) => {
    expect(parseStartingPrice(label)).toBeNull();
  });
});

describe("stripAccent", () => {
  it("retire les ** en gardant le texte", () => {
    expect(stripAccent("Avant de structurer, **où vous en êtes.**")).toBe(
      "Avant de structurer, où vous en êtes.",
    );
  });
});
