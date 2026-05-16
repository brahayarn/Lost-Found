"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { listClaims, type ListParams } from "@/lib/api";

export function useClaims(params: ListParams = {}) {
  return useQuery({
    queryKey: ["claims", params],
    queryFn: () => listClaims(params),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
}
