import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contactMessagesTable = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertContactMessageSchema = createInsertSchema(contactMessagesTable).omit({
  id: true,
  status: true,
  createdAt: true,
});

export type ContactMessage = typeof contactMessagesTable.$inferSelect;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
