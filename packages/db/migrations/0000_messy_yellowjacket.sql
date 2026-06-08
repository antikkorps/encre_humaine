CREATE SCHEMA IF NOT EXISTS "app";
--> statement-breakpoint
CREATE TYPE "app"."audience" AS ENUM('organisation', 'particulier');--> statement-breakpoint
CREATE TYPE "app"."fulfillment_status" AS ENUM('pending', 'shipped', 'delivered');--> statement-breakpoint
CREATE TYPE "app"."lead_status" AS ENUM('new', 'contacted', 'closed');--> statement-breakpoint
CREATE TYPE "app"."order_status" AS ENUM('paid', 'refunded', 'partially_refunded', 'canceled');--> statement-breakpoint
CREATE TYPE "app"."subscriber_status" AS ENUM('pending', 'confirmed', 'unsubscribed');--> statement-breakpoint
CREATE TABLE "app"."contact_leads" (
	"id" uuid PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"email" text NOT NULL,
	"audience" "app"."audience" NOT NULL,
	"message" text NOT NULL,
	"source_page" text,
	"status" "app"."lead_status" DEFAULT 'new' NOT NULL,
	"notification_sent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."newsletter_subscribers" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"status" "app"."subscriber_status" DEFAULT 'pending' NOT NULL,
	"token_hash" text,
	"expires_at" timestamp with time zone,
	"consent_ip" text,
	"consent_user_agent" text,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"resend_contact_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."orders" (
	"id" uuid PRIMARY KEY NOT NULL,
	"stripe_session_id" text NOT NULL,
	"stripe_payment_intent_id" text,
	"stripe_customer_id" text,
	"email" text NOT NULL,
	"name" text,
	"shipping" jsonb,
	"items" jsonb NOT NULL,
	"amount_total" integer NOT NULL,
	"amount_shipping" integer DEFAULT 0,
	"currency" text DEFAULT 'eur' NOT NULL,
	"vat_applied" boolean DEFAULT false NOT NULL,
	"amount_vat" integer DEFAULT 0,
	"status" "app"."order_status" DEFAULT 'paid' NOT NULL,
	"fulfillment_status" "app"."fulfillment_status" DEFAULT 'pending' NOT NULL,
	"tracking_number" text,
	"fulfilled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "leads_email_ix" ON "app"."contact_leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX "leads_status_ix" ON "app"."contact_leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leads_created_ix" ON "app"."contact_leads" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "subscribers_email_ux" ON "app"."newsletter_subscribers" USING btree ("email");--> statement-breakpoint
CREATE INDEX "subscribers_status_ix" ON "app"."newsletter_subscribers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscribers_expires_ix" ON "app"."newsletter_subscribers" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_stripe_session_ux" ON "app"."orders" USING btree ("stripe_session_id");--> statement-breakpoint
CREATE INDEX "orders_email_ix" ON "app"."orders" USING btree ("email");--> statement-breakpoint
CREATE INDEX "orders_fulfillment_ix" ON "app"."orders" USING btree ("fulfillment_status");--> statement-breakpoint
CREATE INDEX "orders_created_ix" ON "app"."orders" USING btree ("created_at");