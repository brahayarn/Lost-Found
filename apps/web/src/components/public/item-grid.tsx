"use client";

import { useItems } from "@/hooks/api/use-items";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicItemCard } from "./public-item-card";

export function ItemGrid({ search }: { search?: string }) {
  const { data, isLoading, isError } = useItems({
    page: 1,
    pageSize: 12,
    search,
    sortField: "createdAt",
    sortDesc: true,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Не вдалось завантажити знахідки.
      </p>
    );
  }

  if (!data || data.data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 p-10 text-center text-sm text-stone-500">
        Поки що нічого не знайдено.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {data.data.map((item) => (
        <PublicItemCard key={item._id} item={item} />
      ))}
    </div>
  );
}
