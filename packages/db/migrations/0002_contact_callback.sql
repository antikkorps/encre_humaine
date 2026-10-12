ALTER TABLE "app"."contact_leads" ALTER COLUMN "message" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."contact_leads" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "app"."contact_leads" ADD COLUMN "callback_days" text;--> statement-breakpoint
ALTER TABLE "app"."contact_leads" ADD COLUMN "callback_slot" text;