"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { type IClaim } from "@lf/shared";
import { useLocale } from "next-intl";
import { useClaims } from "@/hooks/api/use-claims";
import {
  DataTable,
  type DataTableQueryParams,
} from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { useCategoryLabel } from "@/lib/categories";
import { useClaimStatusLabel } from "@/lib/labels";

export default function AdminClaimsPage() {
  const locale = useLocale();
  const categoryLabel = useCategoryLabel();
  const statusLabel = useClaimStatusLabel();
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(locale === "uk" ? "uk-UA" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  const [params, setParams] = useState<DataTableQueryParams>({
    page: 1,
    pageSize: 20,
    search: "",
  });

  const query = useClaims({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
  });

  const columns = useMemo<ColumnDef<IClaim>[]>(
    () => [
      {
        accessorKey: "claimNumber",
        header: "№",
        cell: ({ row }) => (
          <Link
            href={`/admin/claims/${row.original._id}`}
            className="font-mono text-xs text-blue-700 underline-offset-2 hover:underline"
          >
            {row.original.claimNumber}
          </Link>
        ),
      },
      {
        accessorKey: "description",
        header: "Опис",
        cell: ({ row }) => (
          <span className="line-clamp-1 max-w-md">
            {row.original.description}
          </span>
        ),
      },
      {
        accessorKey: "category",
        header: "Категорія",
        cell: ({ row }) => categoryLabel(row.original.category),
      },
      {
        accessorKey: "status",
        header: "Статус",
        cell: ({ row }) => (
          <Badge tone="blue">{statusLabel(row.original.status)}</Badge>
        ),
      },
      { accessorKey: "claimerEmail", header: "Email" },
      {
        accessorKey: "lostAt",
        header: "Втрачено",
        cell: ({ row }) => (
          <span className="text-xs text-stone-600">
            {formatDate(row.original.lostAt)}
          </span>
        ),
      },
    ],
    [categoryLabel, statusLabel, formatDate],
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Заявки</h1>
        <p className="text-sm text-stone-500">
          Подані заявки на втрачені речі.
        </p>
      </div>

      <DataTable<IClaim>
        columns={columns}
        result={query.data}
        isLoading={query.isLoading}
        isError={query.isError}
        params={params}
        onParamsChange={setParams}
        searchPlaceholder="Пошук за описом або кодом CL-…"
      />
    </div>
  );
}
