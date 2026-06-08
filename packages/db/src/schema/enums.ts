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
export const leadStatusEnum = app.enum("lead_status", ["new", "contacted", "closed"]);
export const subscriberStatusEnum = app.enum("subscriber_status", [
  "pending",
  "confirmed",
  "unsubscribed",
]);
