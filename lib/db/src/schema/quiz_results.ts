import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const quizResultsTable = pgTable("quiz_results", {
  id: serial("id").primaryKey(),
  userName: text("user_name"),
  businessName: text("business_name").notNull(),
  businessDescription: text("business_description").notNull(),
  whyItFits: text("why_it_fits").notNull(),
  actionPlan: text("action_plan").notNull(),
  answersJson: text("answers_json").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertQuizResultSchema = createInsertSchema(quizResultsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertQuizResult = z.infer<typeof insertQuizResultSchema>;
export type QuizResult = typeof quizResultsTable.$inferSelect;
