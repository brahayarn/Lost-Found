"use client";

import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DataTableQueryParams {
  page: number;
  pageSize: number;
  search: string;
  sort?: { id: string; desc: boolean };
}

interface DataTableProps<T> {
  columns: ColumnDef<T, any>[];
  result: PaginatedResult<T> | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  params: DataTableQueryParams;
  onParamsChange: (next: DataTableQueryParams) => void;
  searchPlaceholder?: string;
}

export function DataTable<T>({
  columns,
  result,
  isLoading,
  isError,
  errorMessage,
  params,
  onParamsChange,
  searchPlaceholder = "Пошук…",
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(
    params.sort ? [{ id: params.sort.id, desc: params.sort.desc }] : [],
  );

  const table = useReactTable({
    data: result?.data ?? [],
    columns,
    state: { sorting },
    manualPagination: true,
    manualSorting: true,
    pageCount: result ? Math.ceil(result.total / result.pageSize) : 0,
    onSortingChange: (updater) => {
      const next =
        typeof updater === "function" ? updater(sorting) : updater;
      setSorting(next);
      onParamsChange({
        ...params,
        page: 1,
        sort: next[0] ? { id: next[0].id, desc: next[0].desc } : undefined,
      });
    },
    getCoreRowModel: getCoreRowModel(),
  });

  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          value={params.search}
          onChange={(e) =>
            onParamsChange({ ...params, page: 1, search: e.target.value })
          }
          placeholder={searchPlaceholder}
          className="max-w-sm"
        />
        <div className="ml-auto text-sm text-slate-500">
          {result ? `${result.total} записів` : ""}
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-white">
        <Table>
          <THead>
            {table.getHeaderGroups().map((hg) => (
              <TR key={hg.id}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  return (
                    <TH key={header.id}>
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 hover:text-slate-900"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          <ArrowUpDown className="h-3 w-3 opacity-60" />
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </TH>
                  );
                })}
              </TR>
            ))}
          </THead>
          <TBody>
            {isLoading ? (
              <TR>
                <TD colSpan={columns.length} className="h-24 text-center text-slate-500">
                  Завантаження…
                </TD>
              </TR>
            ) : isError ? (
              <TR>
                <TD colSpan={columns.length} className="h-24 text-center text-red-600">
                  {errorMessage ?? "Помилка завантаження"}
                </TD>
              </TR>
            ) : table.getRowModel().rows.length === 0 ? (
              <TR>
                <TD colSpan={columns.length} className="h-24 text-center text-slate-500">
                  Нічого не знайдено
                </TD>
              </TR>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TR key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TD key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TD>
                  ))}
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-slate-600">
          Сторінка {params.page} з {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={params.page <= 1}
          onClick={() =>
            onParamsChange({ ...params, page: Math.max(1, params.page - 1) })
          }
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={params.page >= totalPages}
          onClick={() => onParamsChange({ ...params, page: params.page + 1 })}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
