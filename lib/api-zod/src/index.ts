import { z } from "zod/v4";

export const SupportedLanguage = z.enum(["fr", "en", "es", "de", "pt", "it"]);

export const QuizAnswerSchema = z.object({
  questionId: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const SubmitQuizBody = z.object({
  answers: z.array(QuizAnswerSchema).min(1),
  userName: z.string().trim().min(1).optional(),
  language: SupportedLanguage.optional(),
});

export const GetResultParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const QuizResultSchema = z.object({
  id: z.number().int(),
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
export type SubmitQuizBody = z.infer<typeof SubmitQuizBody>;
export type GetResultParams = z.infer<typeof GetResultParams>;
export type QuizResult = z.infer<typeof QuizResultSchema>;
export type GetResultResponse = z.infer<typeof GetResultResponse>;
export type ListResultsResponse = z.infer<typeof ListResultsResponse>;
export type HealthCheckResponse = z.infer<typeof HealthCheckResponse>;
