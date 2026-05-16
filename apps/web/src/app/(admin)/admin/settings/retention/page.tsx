"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import {
  listRetentionPolicies,
  updateRetentionPolicy,
  type RetentionPolicyApi,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORY_LABEL: Record<string, string> = {
  DOCUMENTS: "Документи",
  ELECTRONICS: "Електроніка",
  KEYS: "Ключі",
  BAG: "Сумки/рюкзаки",
  CLOTHING: "Одяг",
  JEWELRY: "Ювелірні вироби",
  OTHER: "Інше",
};

export default function RetentionPoliciesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["retention-policies"],
    queryFn: listRetentionPolicies,
  });

  const [drafts, setDrafts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (data) {
      const next: Record<string, number> = {};
      for (const p of data) next[p.category] = p.days;
      setDrafts(next);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: ({ category, days }: RetentionPolicyApi) =>
      updateRetentionPolicy(category, days),
    onSuccess: (r) => {
      toast.success("Збережено", {
        description: `${CATEGORY_LABEL[r.category] ?? r.category}: ${r.days} дн.`,
      });
      qc.invalidateQueries({ queryKey: ["retention-policies"] });
    },
    onError: (e) =>
      toast.error("Не вдалось зберегти", {
        description: e instanceof Error ? e.message : undefined,
      }),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Терміни зберігання
        </h1>
        <p className="text-sm text-stone-500">
          Скільки днів річ зберігається до автоматичної утилізації, залежно від
          категорії.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Політики</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="divide-y divide-stone-200">
              {data?.map((p) => (
                <div
                  key={p.category}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-stone-900">
                      {CATEGORY_LABEL[p.category] ?? p.category}
                    </p>
                    <p className="text-xs text-stone-500">{p.category}</p>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    max={3650}
                    value={drafts[p.category] ?? p.days}
                    onChange={(e) =>
                      setDrafts((d) => ({
                        ...d,
                        [p.category]: Number(e.target.value),
                      }))
                    }
                    className="w-24"
                  />
                  <span className="text-xs text-stone-500">дн.</span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      mutation.isPending ||
                      (drafts[p.category] ?? p.days) === p.days
                    }
                    onClick={() =>
                      mutation.mutate({
                        category: p.category,
                        days: drafts[p.category] ?? p.days,
                      })
                    }
                  >
                    Зберегти
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
