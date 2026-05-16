"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { listItems, type ListParams } from "@/lib/api";

export function useItems(params: ListParams = {}) {
  return useQuery({
    queryKey: ["items", params],
    queryFn: () => listItems(params),
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
}
