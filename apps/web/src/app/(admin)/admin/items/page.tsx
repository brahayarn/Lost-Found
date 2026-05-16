"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Printer, Handshake } from "lucide-react";
import { ItemStatus, type IItem } from "@lf/shared";
import { useItems } from "@/hooks/api/use-items";
import { itemLabelUrl } from "@/lib/api";
import {
  DataTable,
  type DataTableQueryParams,
} from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_TONE: Record<ItemStatus, "slate" | "blue" | "amber" | "green" | "red"> = {
  [ItemStatus.NEW]: "blue",
  [ItemStatus.PUBLISHED]: "blue",
  [ItemStatus.MATCHED]: "amber",
  [ItemStatus.CLAIMED]: "amber",
  [ItemStatus.RETURNED]: "green",
  [ItemStatus.TO_DISPOSE]: "red",
  [ItemStatus.ARCHIVED]: "slate",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function AdminItemsPage() {
  const [params, setParams] = useState<DataTableQueryParams>({
    page: 1,
    pageSize: 20,
    search: "",
    sort: { id: "createdAt", desc: true },
  });

  const query = useItems({
    page: params.page,
    pageSize: params.pageSize,
    search: params.search,
    sortField: params.sort?.id,
    sortDesc: params.sort?.desc,
  });

  const columns = useMemo<ColumnDef<IItem>[]>(
    () => [
      {
        accessorKey: "itemNumber",
        header: "№",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.itemNumber}</span>
        ),
      },
      {
        accessorKey: "title",
        header: "Назва",
        cell: ({ row }) => (
          <div className="max-w-[280px]">
            <div className="font-medium text-stone-900 truncate">
              {row.original.title}
            </div>
            <div className="text-xs text-stone-500 truncate">
              {row.original.foundLocation?.address}
            </div>
          </div>
        ),
      },
      { accessorKey: "category", header: "Категорія" },
      {
        accessorKey: "status",
        header: "Статус",
        cell: ({ row }) => (
          <Badge tone={STATUS_TONE[row.original.status]}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: "foundAt",
        header: "Знайдено",
        cell: ({ row }) => (
          <span className="text-stone-600 text-xs">
            {formatDate(row.original.foundAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button asChild variant="outline" size="sm" title="PDF-етикетка">
              <a
                href={itemLabelUrl(row.original._id)}
                target="_blank"
                rel="noreferrer"
              >
                <Printer className="h-3.5 w-3.5" />
              </a>
            </Button>
            {row.original.status !== ItemStatus.RETURNED && (
              <Button
                asChild
                variant="outline"
                size="sm"
                title="Видати річ"
              >
                <Link href={`/admin/handover/${row.original._id}`}>
                  <Handshake className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/items/${row.original._id}`}>Відкрити</Link>
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Знахідки</h1>
          <p className="text-sm text-stone-500">
            Усі зареєстровані речі. Пошук, сортування, пагінація.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/items/new">+ Зареєструвати</Link>
        </Button>
      </div>

      <DataTable<IItem>
        columns={columns}
        result={query.data}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={query.error instanceof Error ? query.error.message : undefined}
        params={params}
        onParamsChange={setParams}
        searchPlaceholder="Пошук за назвою, описом, кодом LF-…"
      />
    </div>
  );
}
