import {
  type QueryKey,
  type UseQueryOptions,
  useQuery,
} from "@tanstack/react-query";
import {
  GetResultResponse,
  ListResultsResponse,
  type GetResultResponse as GetResultResponseType,
  type ListResultsResponse as ListResultsResponseType,
  type QuizAnswer,
} from "@workspace/api-zod";

export type { GetResultResponseType as GetResultResponse, ListResultsResponseType as ListResultsResponse, QuizAnswer };

type QueryOptions<TData> = {
  query?: Omit<UseQueryOptions<TData, Error, TData, QueryKey>, "queryFn"> & {
    queryKey?: QueryKey;
  };
};

async function fetchJson<T>(url: string, parser: { parse: (value: unknown) => T }): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return parser.parse(await response.json());
}

export function getGetResultQueryKey(id: number): QueryKey {
  return ["/quiz/results", id];
}

export function useGetResult(id: number, options?: QueryOptions<GetResultResponseType>) {
  const { queryKey, ...queryOptions } = options?.query ?? {};
  return useQuery<GetResultResponseType, Error>({
    queryKey: queryKey ?? getGetResultQueryKey(id),
    queryFn: () => fetchJson(`/api/quiz/results/${id}`, GetResultResponse),
    ...queryOptions,
  });
}

export function getListResultsQueryKey(): QueryKey {
  return ["/quiz/results"];
}

export function useListResults(options?: QueryOptions<ListResultsResponseType>) {
  const { queryKey, ...queryOptions } = options?.query ?? {};
  return useQuery<ListResultsResponseType, Error>({
    queryKey: queryKey ?? getListResultsQueryKey(),
    queryFn: () => fetchJson("/api/quiz/results", ListResultsResponse),
    ...queryOptions,
  });
}
