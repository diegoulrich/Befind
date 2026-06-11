import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shopsTable = pgTable("shops", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  name: text("name").notNull(),
  slogan: text("slogan").notNull(),
  description: text("description").notNull(),
  niche: text("niche").notNull(),
  primaryColor: text("primary_color").notNull().default("#6366f1"),
  accentColor: text("accent_color").notNull().default("#f59e0b"),
  logoEmoji: text("logo_emoji").notNull().default("🛍️"),
  status: text("status").notNull().default("active"),
  shopifyConnected: boolean("shopify_connected").notNull().default(false),
  shopifyDomain: text("shopify_domain"),
  publicSlug: text("public_slug").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const shopProductsTable = pgTable("shop_products", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id")
    .notNull()
    .references(() => shopsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: text("price").notNull(),
  category: text("category").notNull(),
  imageEmoji: text("image_emoji").notNull().default("📦"),
  supplierHint: text("supplier_hint"),
  marginHint: text("margin_hint"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertShopSchema = createInsertSchema(shopsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertShopProductSchema = createInsertSchema(shopProductsTable).omit({
  id: true,
  createdAt: true,
});

export type Shop = typeof shopsTable.$inferSelect;
export type ShopProduct = typeof shopProductsTable.$inferSelect;
export type InsertShop = z.infer<typeof insertShopSchema>;
export type InsertShopProduct = z.infer<typeof insertShopProductSchema>;
