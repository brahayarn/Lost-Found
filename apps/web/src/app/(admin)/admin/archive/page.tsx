"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { Archive, FileText } from "lucide-react";
import { listHandoverActs } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { useLocale } from "next-intl";

const toIsoDate = (d: Date | undefined): string => {
  if (!d) return "";
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
};

export default function ArchivePage() {
  const locale = useLocale();
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(locale === "uk" ? "uk-UA" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState<Date | undefined>();
  const [to, setTo] = useState<Date | undefined>();

  const { data, isLoading } = useQuery({
    queryKey: ["handover-acts", page, search, from, to],
    queryFn: () =>
      listHandoverActs({
        page,
        pageSize: 20,
        search,
        from: from ? toIsoDate(from) : undefined,
        to: to ? toIsoDate(to) : undefined,
      }),
    placeholderData: (prev) => prev,
  });

  const rows = data?.data ?? [];
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Архів повернень
        </h1>
        <p className="text-sm text-stone-500">
          Підписані акти видачі. Записи незмінні.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Акти ({data?.total ?? 0})</CardTitle>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <DatePicker
              value={from}
              onChange={setFrom}
              placeholder="Від"
              clearable
            />
            <DatePicker
              value={to}
              onChange={setTo}
              placeholder="До"
              clearable
            />
            <Input
              placeholder="Оператор / нотатки"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <Skeleton className="m-6 h-64" />
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-12 text-sm text-stone-500">
              <Archive className="h-10 w-10 text-stone-300" strokeWidth={1.2} />
              Актів поки що немає.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="px-4 py-2 text-left">Дата видачі</th>
                    <th className="px-4 py-2 text-left">Знахідка</th>
                    <th className="px-4 py-2 text-left">Заявка</th>
                    <th className="px-4 py-2 text-left">Оператор</th>
                    <th className="px-4 py-2 text-left">Нотатки</th>
                    <th className="px-4 py-2 text-left">Акт</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {rows.map((r) => {
                    const item =
                      typeof r.itemId === "object" ? r.itemId : null;
                    const claim =
                      r.claimId && typeof r.claimId === "object"
                        ? r.claimId
                        : null;
                    return (
                      <tr key={r._id}>
                        <td className="whitespace-nowrap px-4 py-2 font-mono text-xs">
                          {fmt(r.handoverDate)}
                        </td>
                        <td className="px-4 py-2">
                          {item ? (
                            <Link
                              href={`/admin/items/${item._id}`}
                              className="text-blue-700 underline-offset-2 hover:underline"
                            >
                              <span className="font-mono text-xs">
                                {item.itemNumber}
                              </span>
                              <span className="ml-2 text-stone-700">
                                {item.title}
                              </span>
                            </Link>
                          ) : (
                            <span className="text-xs text-stone-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {claim ? (
                            <Link
                              href={`/admin/claims/${claim._id}`}
                              className="font-mono text-xs text-blue-700 underline-offset-2 hover:underline"
                            >
                              {claim.claimNumber}
                            </Link>
                          ) : (
                            <span className="text-xs text-stone-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-xs">
                          {r.operatorName}
                        </td>
                        <td className="px-4 py-2 text-xs text-stone-600">
                          <span className="line-clamp-1 max-w-xs">
                            {r.notes ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/admin/archive/${r._id}`}>
                              <FileText className="mr-1 h-3.5 w-3.5" />
                              Переглянути
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          ← Назад
        </Button>
        <span className="text-xs text-stone-500">
          Сторінка {page} з {totalPages || 1}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Далі →
        </Button>
      </div>
    </div>
  );
}
