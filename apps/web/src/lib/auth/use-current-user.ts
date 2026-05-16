"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMe } from "@/lib/api";
import { tokenStorage } from "./token";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: fetchMe,
    enabled: typeof window !== "undefined" && !!tokenStorage.get(),
    staleTime: 60_000,
    retry: false,
  });
}
