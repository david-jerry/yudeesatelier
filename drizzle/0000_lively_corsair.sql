CREATE TYPE "public"."product_measurement_unit_enum" AS ENUM('cm', 'in');--> statement-breakpoint
CREATE TYPE "public"."product_size_variant_enum" AS ENUM('S', 'M', 'L', 'XL');--> statement-breakpoint
CREATE TYPE "public"."order_delivery_status_enum" AS ENUM('pending', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."bulk_request_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TABLE "account" (
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"id" text PRIMARY KEY NOT NULL,
	"updated_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "passkey" (
	"name" text,
	"public_key" text NOT NULL,
	"user_id" text NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean DEFAULT false NOT NULL,
	"transports" text,
	"aaguid" text,
	"id" text PRIMARY KEY NOT NULL,
	"updated_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"base_price" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"quantity" numeric DEFAULT '1' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"tag" text,
	"id" text PRIMARY KEY NOT NULL,
	"updated_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "product_name_unique" UNIQUE("name"),
	CONSTRAINT "product_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "product_discount" (
	"percentage" numeric(5, 2) NOT NULL,
	"code" text NOT NULL,
	"usage" numeric DEFAULT '1' NOT NULL,
	"expires" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"updated_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "product_discount_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "product_image" (
	"url" text NOT NULL,
	"url_id" text NOT NULL,
	"product_id" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"updated_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "product_image_url_id_unique" UNIQUE("url_id")
);
--> statement-breakpoint
CREATE TABLE "product_measurement" (
	"product_size_variant_id" text NOT NULL,
	"key" text DEFAULT 'height' NOT NULL,
	"value" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"unit" "product_measurement_unit_enum" DEFAULT 'cm' NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"updated_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_size_variant" (
	"product_id" text NOT NULL,
	"size" "product_size_variant_enum" DEFAULT 'M' NOT NULL,
	"extra_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"updated_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"impersonated_by" text,
	"user_id" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"updated_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"updated_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "tag_name_unique" UNIQUE("name"),
	CONSTRAINT "tag_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text DEFAULT 'https://placehold.co/400',
	"user_image_public_id" text,
	"subscribed" boolean DEFAULT false,
	"is_admin" boolean DEFAULT false,
	"is_staff" boolean DEFAULT false,
	"id" text PRIMARY KEY NOT NULL,
	"updated_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"updated_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet" (
	"id" text PRIMARY KEY NOT NULL,
	"updated_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"user_id" text NOT NULL,
	"holding" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"withdrawn" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	CONSTRAINT "wallet_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "wishlist" (
	"user_id" text NOT NULL,
	"product_id" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"updated_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" text PRIMARY KEY NOT NULL,
	"updated_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"order_id" text NOT NULL,
	"guest_email" text,
	"user_id" text,
	"total_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"is_paid" boolean DEFAULT false NOT NULL,
	"paid_at" timestamp,
	CONSTRAINT "order_order_id_unique" UNIQUE("order_id")
);
--> statement-breakpoint
CREATE TABLE "order_delivery" (
	"order_id" text NOT NULL,
	"status" "order_delivery_status_enum" DEFAULT 'pending' NOT NULL,
	"tracking_number" text,
	"shipping_address" text,
	"shipping_city" text,
	"shipping_state" text,
	"shipping_postal_code" text,
	"shipping_country" text,
	"shipped_at" timestamp,
	"delivered_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "order_item" (
	"order_id" text NOT NULL,
	"product_id" text NOT NULL,
	"size_variant" text NOT NULL,
	"quantity" numeric(10, 0) DEFAULT '1' NOT NULL,
	"price_at_purchase" numeric(10, 2) DEFAULT '0.00' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bulk_request" (
	"id" text PRIMARY KEY NOT NULL,
	"updated_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"request_id" text NOT NULL,
	"user_id" text NOT NULL,
	"product_size_id" text NOT NULL,
	"quantity" numeric(10, 0) DEFAULT '1' NOT NULL,
	"status" "bulk_request_status_enum" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	CONSTRAINT "bulk_request_request_id_unique" UNIQUE("request_id")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_tag_tag_slug_fk" FOREIGN KEY ("tag") REFERENCES "public"."tag"("slug") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_image" ADD CONSTRAINT "product_image_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_measurement" ADD CONSTRAINT "product_measurement_product_size_variant_id_product_size_variant_id_fk" FOREIGN KEY ("product_size_variant_id") REFERENCES "public"."product_size_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_size_variant" ADD CONSTRAINT "product_size_variant_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet" ADD CONSTRAINT "wallet_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_delivery" ADD CONSTRAINT "order_delivery_order_id_order_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("order_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_order_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("order_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_size_variant_product_size_variant_id_fk" FOREIGN KEY ("size_variant") REFERENCES "public"."product_size_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bulk_request" ADD CONSTRAINT "bulk_request_product_size_id_product_size_variant_id_fk" FOREIGN KEY ("product_size_id") REFERENCES "public"."product_size_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_created_at_idx" ON "account" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "account_user_id_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "account_account_id_idx" ON "account" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "passkey_created_at_idx" ON "passkey" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "passkey_user_id_idx" ON "passkey" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "product_created_at_idx" ON "product" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "product_name_idx" ON "product" USING btree ("name");--> statement-breakpoint
CREATE INDEX "product_slug_idx" ON "product" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "product_discount_created_at_idx" ON "product_discount" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "product_discount_code_idx" ON "product_discount" USING btree ("code");--> statement-breakpoint
CREATE INDEX "product_image_created_at_idx" ON "product_image" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "product_image_product_id_idx" ON "product_image" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_measurement_created_at_idx" ON "product_measurement" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "product_measurement_product_size_variant_id_idx" ON "product_measurement" USING btree ("product_size_variant_id");--> statement-breakpoint
CREATE INDEX "product_size_variant_created_at_idx" ON "product_size_variant" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "product_size_variant_product_id_idx" ON "product_size_variant" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "session_created_at_idx" ON "session" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "session_user_id_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_token_idx" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "tag_created_at_idx" ON "tag" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tag_name_idx" ON "tag" USING btree ("name");--> statement-breakpoint
CREATE INDEX "tag_slug_idx" ON "tag" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "user_created_at_idx" ON "user" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "user_email_idx" ON "user" USING btree ("email");--> statement-breakpoint
CREATE INDEX "verification_created_at_idx" ON "verification" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "wallet_created_at_idx" ON "wallet" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "wallet_user_id_idx" ON "wallet" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "wishlist_created_at_idx" ON "wishlist" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "wishlist_user_id_idx" ON "wishlist" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "wishlist_product_id_idx" ON "wishlist" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "order_created_at_idx" ON "order" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "order_user_id_idx" ON "order" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "order_order_id_idx" ON "order" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_delivery_order_id_idx" ON "order_delivery" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_item_order_id_idx" ON "order_item" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "bulk_request_created_at_idx" ON "bulk_request" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "bulk_request_user_id_idx" ON "bulk_request" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bulk_request_product_size_id_idx" ON "bulk_request" USING btree ("product_size_id");