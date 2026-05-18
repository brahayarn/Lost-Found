"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BellOff } from "lucide-react";
import {
  listSubscriptions,
  deactivateSubscription,
  type SubscriptionApi,
} from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "next-intl";
import { useCategoryLabel } from "@/lib/categories";

export default function SubscriptionsPage() {
  const qc = useQueryClient();
  const locale = useLocale();
  const categoryLabel = useCategoryLabel();
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(locale === "uk" ? "uk-UA" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["subscriptions", search],
    queryFn: () => listSubscriptions({ pageSize: 100, search }),
    placeholderData: (p) => p,
  });

  const deactivateMut = useMutation({
    mutationFn: (id: string) => deactivateSubscription(id),
    onSuccess: () => {
      toast.success("Підписку деактивовано");
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
    },
    onError: (e) =>
      toast.error("Не вдалось", {
        description: e instanceof Error ? e.message : undefined,
      }),
  });

  const rows: SubscriptionApi[] = data?.data ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Підписки</h1>
        <p className="text-sm text-stone-500">
          Гості, що підписались на сповіщення про нові знахідки.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <CardTitle>
            Всього: {data?.total ?? 0}
          </CardTitle>
          <Input
            placeholder="Пошук за email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:w-72"
          />
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <Skeleton className="m-6 h-64" />
          ) : rows.length === 0 ? (
            <p className="p-6 text-sm text-stone-500">Підписок поки немає.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Категорія</th>
                    <th className="px-4 py-2 text-left">Ключові слова</th>
                    <th className="px-4 py-2 text-left">Створено</th>
                    <th className="px-4 py-2 text-left">Стан</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {rows.map((r) => (
                    <tr key={r._id}>
                      <td className="px-4 py-2 text-xs">{r.email}</td>
                      <td className="px-4 py-2">
                        <Badge tone="slate">{categoryLabel(r.category)}</Badge>
                      </td>
                      <td className="px-4 py-2 text-xs text-stone-600">
                        {r.keywords.length ? (
                          <div className="flex flex-wrap gap-1">
                            {r.keywords.map((k) => (
                              <span
                                key={k}
                                className="rounded bg-stone-100 px-1.5 py-0.5"
                              >
                                {k}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-stone-400">— будь-які —</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-stone-500">
                        {fmt(r.createdAt)}
                      </td>
                      <td className="px-4 py-2">
                        {r.active ? (
                          <Badge tone="green">Активна</Badge>
                        ) : (
                          <Badge tone="slate">Деактив.</Badge>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {r.active && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={deactivateMut.isPending}
                            onClick={() => deactivateMut.mutate(r._id)}
                          >
                            <BellOff className="mr-1 h-3.5 w-3.5" /> Вимкнути
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
