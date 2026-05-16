"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listAuditLogs, type AuditLogApi } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const methodTone = (m: string): "blue" | "amber" | "red" | "slate" => {
  if (m === "POST") return "blue";
  if (m === "PATCH" || m === "PUT") return "amber";
  if (m === "DELETE") return "red";
  return "slate";
};

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [actorId, setActorId] = useState("");
  const [action, setAction] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page, actorId, action],
    queryFn: () =>
      listAuditLogs({ page, pageSize: 50, actorId, action }),
    placeholderData: (prev) => prev,
  });

  const rows: AuditLogApi[] = data?.data ?? [];
  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Журнал аудиту
        </h1>
        <p className="text-sm text-stone-500">
          Усі зміни в системі: хто, коли, звідки та що саме змінив.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Події</CardTitle>
            {data && (
              <p className="mt-1 text-xs text-stone-500">
                Всього: {data.total}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Email актора"
              value={actorId}
              onChange={(e) => setActorId(e.target.value)}
              className="sm:w-56"
            />
            <Input
              placeholder="Action (GET /items/...)"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="sm:w-72"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <Skeleton className="m-6 h-64" />
          ) : rows.length === 0 ? (
            <p className="p-6 text-sm text-stone-500">Записів немає.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                  <tr>
                    <th className="px-4 py-2 text-left">Час</th>
                    <th className="px-4 py-2 text-left">Метод</th>
                    <th className="px-4 py-2 text-left">Action</th>
                    <th className="px-4 py-2 text-left">Актор</th>
                    <th className="px-4 py-2 text-left">IP</th>
                    <th className="px-4 py-2 text-left">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {rows.map((r) => (
                    <tr key={r._id}>
                      <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-stone-600">
                        {fmt(r.createdAt)}
                      </td>
                      <td className="px-4 py-2">
                        <Badge tone={methodTone(r.method)}>{r.method}</Badge>
                      </td>
                      <td className="px-4 py-2 font-mono text-xs">{r.path}</td>
                      <td className="px-4 py-2 text-xs">
                        {r.actorEmail ?? "—"}
                      </td>
                      <td className="px-4 py-2 font-mono text-xs text-stone-500">
                        {r.ip ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-xs">
                        <span
                          className={
                            r.statusCode && r.statusCode >= 400
                              ? "text-red-600"
                              : "text-stone-700"
                          }
                        >
                          {r.statusCode ?? "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
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
