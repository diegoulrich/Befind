import { z } from "zod/v4";

export const QuizAnswerSchema = z.object({
  questionId: z.string(),
  question: z.string(),
  answer: z.string(),
});

export const SubmitQuizBody = z.object({
  answers: z.array(QuizAnswerSchema).min(1),
  email: z.string().trim().email(),
  userName: z.string().trim().optional(),
  language: z.enum(["fr", "en", "es", "de", "pt", "it"]).optional(),
});

export const GetResultParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const QuizResultSchema = z.object({
  id: z.number(),
  userName: z.string().nullable(),
  businessName: z.string(),
  businessDescription: z.string(),
  whyItFits: z.string(),
  actionPlan: z.string(),
  answersJson: z.string(),
  createdAt: z.coerce.date(),
});

export const GetResultResponse = QuizResultSchema;
export const ListResultsResponse = z.array(QuizResultSchema);

export const HealthCheckResponse = z.object({
  status: z.literal("ok"),
});

export type QuizAnswer = z.infer<typeof QuizAnswerSchema>;
export type SubmitQuizBodyType = z.infer<typeof SubmitQuizBody>;
export type QuizResult = z.infer<typeof QuizResultSchema>;
