import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { ContactPayloadSchema } from "./contact.ts";
import { NewsletterSubscribeSchema } from "./newsletter.ts";

describe("ContactPayloadSchema", () => {
  const valid = {
    firstName: "Eléonore",
    phone: "06 12 34 56 78",
    email: "test@example.com",
    audience: "organisation" as const,
    callbackDays: ["mardi", "jeudi"],
    callbackSlot: "matin",
    turnstileToken: "tok",
  };

  it("accepte un payload valide, message facultatif (vide par défaut)", () => {
    const r = v.safeParse(ContactPayloadSchema, valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.output.message).toBe("");
  });

  it("accepte un numéro international", () => {
    const r = v.safeParse(ContactPayloadSchema, { ...valid, phone: "+33 (0)6.12.34.56.78" });
    expect(r.success).toBe(true);
  });

  it("rejette un numéro incomplet ou fantaisiste", () => {
    expect(v.safeParse(ContactPayloadSchema, { ...valid, phone: "06 12" }).success).toBe(false);
    expect(v.safeParse(ContactPayloadSchema, { ...valid, phone: "appelez-moi" }).success).toBe(
      false,
    );
  });

  it("exige au moins un jour, et refuse « peu importe » combiné à un jour", () => {
    expect(v.safeParse(ContactPayloadSchema, { ...valid, callbackDays: [] }).success).toBe(false);
    expect(
      v.safeParse(ContactPayloadSchema, { ...valid, callbackDays: ["peu importe", "lundi"] })
        .success,
    ).toBe(false);
    expect(
      v.safeParse(ContactPayloadSchema, { ...valid, callbackDays: ["peu importe"] }).success,
    ).toBe(true);
  });

  it("rejette un moment de la journée inconnu", () => {
    const r = v.safeParse(ContactPayloadSchema, { ...valid, callbackSlot: "minuit" });
    expect(r.success).toBe(false);
  });

  it("rejette une audience inconnue", () => {
    const r = v.safeParse(ContactPayloadSchema, { ...valid, audience: "robot" });
    expect(r.success).toBe(false);
  });

  it("exige le token Turnstile", () => {
    const r = v.safeParse(ContactPayloadSchema, { ...valid, turnstileToken: "" });
    expect(r.success).toBe(false);
  });
});

describe("NewsletterSubscribeSchema", () => {
  it("accepte sans prénom (optionnel)", () => {
    const r = v.safeParse(NewsletterSubscribeSchema, {
      email: "a@b.com",
      turnstileToken: "tok",
    });
    expect(r.success).toBe(true);
  });

  it("rejette un email invalide", () => {
    const r = v.safeParse(NewsletterSubscribeSchema, {
      email: "pas-un-email",
      turnstileToken: "tok",
    });
    expect(r.success).toBe(false);
  });
});
