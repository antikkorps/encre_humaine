import { app } from "./_schema.ts";

/** Enums du schéma `app` — docs/01-data-model.md §4. */
export const audienceEnum = app.enum("audience", ["organisation", "particulier"]);
export const orderStatusEnum = app.enum("order_status", [
  "paid",
  "refunded",
  "partially_refunded",
  "canceled",
]);
export const fulfillmentStatusEnum = app.enum("fulfillment_status", [
  "pending",
  "shipped",
  "delivered",
]);
/** Diagnostic B2B (organisations) ou B2C (particuliers) — docs/11-diagnostics.md. */
export const diagnosticKindEnum = app.enum("diagnostic_kind", ["b2b", "b2c"]);
export const leadStatusEnum = app.enum("lead_status", ["new", "contacted", "closed"]);
export const subscriberStatusEnum = app.enum("subscriber_status", [
  "pending",
  "confirmed",
  "unsubscribed",
]);
