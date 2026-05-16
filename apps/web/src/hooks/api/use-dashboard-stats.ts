"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchDashboardSummary,
  fetchDailyAnalytics,
  fetchCategoryAnalytics,
  fetchLocationAnalytics,
} from "@/lib/api";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: fetchDashboardSummary,
    staleTime: 30_000,
  });
}

export function useDailyAnalytics() {
  return useQuery({
    queryKey: ["analytics", "daily"],
    queryFn: fetchDailyAnalytics,
    staleTime: 60_000,
  });
}

export function useCategoryAnalytics() {
  return useQuery({
    queryKey: ["analytics", "categories"],
    queryFn: fetchCategoryAnalytics,
    staleTime: 60_000,
  });
}

export function useLocationAnalytics() {
  return useQuery({
    queryKey: ["analytics", "locations"],
    queryFn: fetchLocationAnalytics,
    staleTime: 60_000,
  });
}
