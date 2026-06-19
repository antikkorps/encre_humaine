// @vitest-environment node
//
// Formatage prix (FR) — utils/price.ts. Le montant vient de Stripe en centimes.
import { describe, expect, it } from "vitest";
import { formatPrice } from "../utils/price";

// Espaces insécables (NBSP / narrow NBSP) selon l'environnement Intl : on normalise
// pour comparer le contenu, pas le type d'espace.
const norm = (s: string) => s.replace(/ | /g, " ");

describe("formatPrice", () => {
  it("formate des centimes EUR en monnaie française", () => {
    expect(norm(formatPrice(2900, "eur"))).toBe("29,00 €");
    expect(norm(formatPrice(150000, "eur"))).toBe("1 500,00 €");
  });

  it("tolère une devise en minuscules (Stripe)", () => {
    expect(norm(formatPrice(990, "eur"))).toBe("9,90 €");
  });

  it("zéro → 0,00 €", () => {
    expect(norm(formatPrice(0, "eur"))).toBe("0,00 €");
  });
});
