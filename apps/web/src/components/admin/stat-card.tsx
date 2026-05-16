import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string | undefined;
  hint?: string;
  icon: LucideIcon;
  loading?: boolean;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  loading,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
            {label}
          </p>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p className="text-3xl font-semibold tracking-tight text-stone-900">
              {value ?? "—"}
            </p>
          )}
          {hint && <p className="text-xs text-stone-500">{hint}</p>}
        </div>
        <div className="rounded-lg bg-stone-100 p-2.5 text-stone-700">
          <Icon className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}
