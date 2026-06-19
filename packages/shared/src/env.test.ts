import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./env.ts";

const base: Record<string, string> = {
  BASE_URL: "https://lencre-humaine.com",
  APP_DATABASE_URL: "postgres://app_user:x@postgres:5432/encre?search_path=app",
  DIRECTUS_PUBLIC_URL: "https://cms.lencre-humaine.com",
  DIRECTUS_READ_TOKEN: "tok",
  STRIPE_SECRET_KEY: "sk_test_x",
  STRIPE_WEBHOOK_SECRET: "whsec_x",
  STRIPE_SHIPPING_RATE_FR: "shr_x",
  RESEND_API_KEY: "re_x",
  RESEND_AUDIENCE_ID: "aud_x",
  NEWSLETTER_FROM: "L'Encre Humaine <contact@lencre-humaine.com>",
  CONTACT_NOTIFY_TO: "eleonore@example.com",
  TURNSTILE_SITE_KEY: "site",
  TURNSTILE_SECRET_KEY: "secret",
  BOOKING_URL: "https://cal.com/eleonore/decouverte",
};

describe("parseServerEnv", () => {
  it("valide une config complète et applique les défauts TVA", () => {
    const env = parseServerEnv(base);
    expect(env.VAT_ENABLED).toBe(false);
    expect(env.VAT_RATE).toBe(0);
    expect(env.BASE_URL).toBe("https://lencre-humaine.com");
  });

  it("convertit VAT_ENABLED='true' en booléen", () => {
    const env = parseServerEnv({ ...base, VAT_ENABLED: "true", VAT_RATE: "20" });
    expect(env.VAT_ENABLED).toBe(true);
    expect(env.VAT_RATE).toBe(20);
  });

  it("refuse de démarrer si une variable requise manque", () => {
    const { STRIPE_SECRET_KEY: _omit, ...incomplete } = base;
    expect(() => parseServerEnv(incomplete)).toThrowError(/environnement invalide/);
  });

  it("rejette une BASE_URL malformée", () => {
    expect(() => parseServerEnv({ ...base, BASE_URL: "pas-une-url" })).toThrow();
  });
});
