CREATE TYPE "public"."device_type" AS ENUM('phone', 'computer', 'tablet');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'moderator', 'admin');--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "brand" text DEFAULT 'Unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "device_type" "device_type" DEFAULT 'phone' NOT NULL;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "condition_summary" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "moderation_notes" text;--> statement-breakpoint
ALTER TABLE "listings" ADD COLUMN "risk_score" integer DEFAULT 50 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" "user_role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "is_banned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "trust_score" integer DEFAULT 80 NOT NULL;