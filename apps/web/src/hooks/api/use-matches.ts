"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { listMatches } from "@/lib/api";

export function useMatches(
  params: { page?: number; pageSize?: number; status?: string } = {},
) {
  return useQuery({
    queryKey: ["matches", params],
    queryFn: () => listMatches(params),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
}
