import * as v from "valibot";
import { describe, expect, it } from "vitest";
import { ContactPayloadSchema } from "./contact.ts";
import { NewsletterSubscribeSchema } from "./newsletter.ts";

describe("ContactPayloadSchema", () => {
  const valid = {
    firstName: "Eléonore",
    email: "test@example.com",
    audience: "organisation" as const,
    message: "Bonjour, j'aimerais en savoir plus sur vos offres.",
    turnstileToken: "tok",
  };

  it("accepte un payload valide", () => {
    expect(v.safeParse(ContactPayloadSchema, valid).success).toBe(true);
  });

  it("rejette un message trop court (< 10)", () => {
    const r = v.safeParse(ContactPayloadSchema, { ...valid, message: "court" });
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
