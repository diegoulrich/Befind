import { integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { usersTable } from "./users";

export const premiumToolStatesTable = pgTable("premium_tool_states", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  workspace: text("workspace").notNull(),
  module: text("module").notNull(),
  businessName: text("business_name").notNull(),
  fieldValues: jsonb("field_values").notNull().default({}),
  generatedOutput: text("generated_output").notNull().default(""),
  savedNote: text("saved_note").notNull().default(""),
  completedTasks: jsonb("completed_tasks").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPremiumToolStateSchema = createInsertSchema(premiumToolStatesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type PremiumToolState = typeof premiumToolStatesTable.$inferSelect;
export type InsertPremiumToolState = z.infer<typeof insertPremiumToolStateSchema>;
