"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Heart, Shield, Loader2 } from "lucide-react";
import { ItemStatus, type IItem } from "@lf/shared";
import { listItemsAdmin, disposeItems } from "@/lib/api";
import { useCategoryLabel } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

type Action = "POLICE" | "CHARITY" | "DESTROY";

const ACTION_LABEL: Record<Action, string> = {
  POLICE: "Передати в поліцію",
  CHARITY: "На благодійність",
  DESTROY: "Утилізувати",
};

export default function DisposalsPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const categoryLabel = useCategoryLabel();

  const { data, isLoading } = useQuery({
    queryKey: ["items", "to-dispose"],
    queryFn: () =>
      listItemsAdmin({
        status: ItemStatus.TO_DISPOSE,
        page: 1,
        pageSize: 100,
      }),
    staleTime: 10_000,
  });

  const dispose = useMutation({
    mutationFn: ({ ids, action }: { ids: string[]; action: Action }) =>
      disposeItems(ids, action),
    onSuccess: (res) => {
      toast.success(`Архівовано: ${res.modified}`, {
        description: ACTION_LABEL[res.action as Action],
      });
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (err: Error) =>
      toast.error("Не вдалось виконати", { description: err.message }),
  });

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (!data?.data) return;
    if (selected.size === data.data.length) setSelected(new Set());
    else setSelected(new Set(data.data.map((i) => i._id)));
  };

  const rows = useMemo(() => data?.data ?? [], [data]);
  const allSelected = rows.length > 0 && selected.size === rows.length;
  const ids = Array.from(selected);

  const runAction = (action: Action) => {
    if (ids.length === 0) {
      toast.error("Виберіть хоча б одну річ");
      return;
    }
    dispose.mutate({ ids, action });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Утилізація</h1>
        <p className="text-sm text-stone-500">
          Речі, термін зберігання яких вже вийшов. Виберіть і застосуйте дію.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Прострочені знахідки</CardTitle>
            <CardDescription>
              Статус: <Badge tone="red">До утилізації</Badge>{" "}
              <span className="ml-2">{rows.length} записів</span>
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => runAction("POLICE")}
              disabled={dispose.isPending || ids.length === 0}
            >
              <Shield className="mr-1.5 h-3.5 w-3.5" /> Поліція
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => runAction("CHARITY")}
              disabled={dispose.isPending || ids.length === 0}
            >
              <Heart className="mr-1.5 h-3.5 w-3.5" /> Благодійність
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => runAction("DESTROY")}
              disabled={dispose.isPending || ids.length === 0}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Утилізувати
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : rows.length === 0 ? (
            <p className="rounded-lg border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
              Немає прострочених речей. 🎉
            </p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH className="w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label="Вибрати все"
                    />
                  </TH>
                  <TH>№</TH>
                  <TH>Назва</TH>
                  <TH>Категорія</TH>
                  <TH>Зберігаємо до</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((item: IItem) => (
                  <TR key={item._id}>
                    <TD>
                      <input
                        type="checkbox"
                        checked={selected.has(item._id)}
                        onChange={() => toggle(item._id)}
                      />
                    </TD>
                    <TD>
                      <span className="font-mono text-xs">
                        {item.itemNumber}
                      </span>
                    </TD>
                    <TD className="max-w-md truncate">{item.title}</TD>
                    <TD>{categoryLabel(item.category)}</TD>
                    <TD className="text-xs text-stone-600">
                      {item.retentionDate
                        ? fmt(String(item.retentionDate))
                        : "—"}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}

          {dispose.isPending && (
            <div className="mt-3 flex items-center gap-2 text-sm text-stone-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Обробка…
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
