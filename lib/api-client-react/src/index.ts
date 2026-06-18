import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import {
  GetResultResponse,
  ListResultsResponse,
  type QuizAnswer,
  type QuizResult,
} from "@workspace/api-zod";

export type { QuizAnswer, QuizResult };

export function getGetResultQueryKey(id: number) {
  return ["quiz-result", id] as const;
}

export function getListResultsQueryKey() {
  return ["quiz-results"] as const;
}

function getAuthHeaders(): HeadersInit {
  if (typeof window === "undefined") return {};

  const token = window.localStorage.getItem("befind_auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson<T>(url: string, parser: { parse: (data: unknown) => T }): Promise<T> {
  const response = await fetch(url, { headers: getAuthHeaders() });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return parser.parse(await response.json());
}

export function useGetResult(
  id: number,
  options?: {
    query?: Partial<
      UseQueryOptions<QuizResult, Error, QuizResult, ReturnType<typeof getGetResultQueryKey>>
    >;
  },
) {
  return useQuery({
    queryKey: getGetResultQueryKey(id),
    queryFn: () => fetchJson(`/api/quiz/results/${id}`, GetResultResponse),
    enabled: Number.isFinite(id),
    ...options?.query,
  });
}

export function useListResults(
  options?: {
    query?: Partial<
      UseQueryOptions<QuizResult[], Error, QuizResult[], ReturnType<typeof getListResultsQueryKey>>
    >;
  },
) {
  return useQuery({
    queryKey: getListResultsQueryKey(),
    queryFn: () => fetchJson("/api/quiz/results", ListResultsResponse),
    ...options?.query,
  });
}
