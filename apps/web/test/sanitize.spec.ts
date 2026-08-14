// @vitest-environment node
//
// Assainissement du rich text Directus — docs/06 §1, contrat RichText.
// Vérifie que l'allowlist retire le HTML dangereux et durcit les liens.
import { describe, expect, it } from "vitest";
import { sanitizeRichText } from "../server/utils/sanitize";

describe("sanitizeRichText", () => {
  it("retire les balises script et leur contenu", () => {
    expect(sanitizeRichText("<p>ok</p><script>alert(1)</script>")).toBe("<p>ok</p>");
  });

  it("retire les gestionnaires d'événements et styles inline", () => {
    const out = sanitizeRichText('<p onclick="evil()" style="color:red">x</p>');
    expect(out).toBe("<p>x</p>");
  });

  it("neutralise les href javascript:", () => {
    expect(sanitizeRichText('<a href="javascript:alert(1)">x</a>')).not.toContain("javascript:");
  });

  it("conserve les balises de l'allowlist (titres, listes, emphase)", () => {
    const html = "<h2>Titre</h2><ul><li><strong>a</strong></li></ul><blockquote>q</blockquote>";
    expect(sanitizeRichText(html)).toBe(html);
  });

  it("durcit les liens externes (rel noopener) en gardant href http(s)/mailto", () => {
    const out = sanitizeRichText('<a href="https://exemple.fr" target="_blank">lien</a>');
    expect(out).toContain('href="https://exemple.fr"');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(sanitizeRichText('<a href="mailto:hi@exemple.fr">mail</a>')).toContain("mailto:");
  });

  // Mise en avant dorée : la convention `**…**` vaut AUSSI dans le WYSIWYG, pour
  // qu'Éléonore n'ait pas à retenir quel type de champ l'accepte.
  it("transforme `**…**` en gras doré", () => {
    expect(sanitizeRichText("<p>un mot **en avant** ici</p>")).toBe(
      '<p>un mot <strong class="accent">en avant</strong> ici</p>',
    );
  });

  it("laisse le `**` non apparié tel quel (aucune perte de texte)", () => {
    expect(sanitizeRichText("<p>2 ** 3 = 8</p>")).toBe("<p>2 ** 3 = 8</p>");
  });

  it("ne met pas en avant à cheval sur une balise (emboîtement invalide)", () => {
    const html = "<p>**début</p><p>fin**</p>";
    expect(sanitizeRichText(html)).toBe(html);
  });

  it("n'injecte aucun attribut venant de l'entrée", () => {
    // Le fragment ne peut contenir ni `<` ni `>` : il atterrit toujours APRÈS le
    // `>` de notre `<strong>`, donc en position de texte. Une tentative d'y
    // glisser un attribut reste du contenu inerte, guillemets compris.
    expect(sanitizeRichText('<p>**x" onclick="evil()**</p>')).toBe(
      '<p><strong class="accent">x" onclick="evil()</strong></p>',
    );
  });

  it('renvoie "" pour une entrée vide ou nulle', () => {
    expect(sanitizeRichText(null)).toBe("");
    expect(sanitizeRichText(undefined)).toBe("");
    expect(sanitizeRichText("")).toBe("");
  });
});
