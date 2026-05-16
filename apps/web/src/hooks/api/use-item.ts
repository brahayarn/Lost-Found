"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchItem, fetchItemFull } from "@/lib/api";

export function useItem(id: string | undefined) {
  return useQuery({
    queryKey: ["items", "one", id],
    queryFn: () => fetchItem(id!),
    enabled: !!id,
    staleTime: 10_000,
  });
}

export function useItemFull(id: string | undefined) {
  return useQuery({
    queryKey: ["items", "full", id],
    queryFn: () => fetchItemFull(id!),
    enabled: !!id,
    staleTime: 10_000,
  });
}
