"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Check,
  Handshake,
  ImageOff,
  MapPin,
  Printer,
  Tag,
} from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ItemStatus } from "@lf/shared";
import { useItemFull } from "@/hooks/api/use-item";
import { itemLabelUrl, verifyItem } from "@/lib/api";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategoryLabel } from "@/lib/categories";
import { useItemStatusLabel } from "@/lib/labels";
import { useLocale } from "next-intl";

const STATUS_TONE: Record<
  ItemStatus,
  "slate" | "blue" | "amber" | "green" | "red"
> = {
  [ItemStatus.NEW]: "blue",
  [ItemStatus.VERIFICATION]: "amber",
  [ItemStatus.PUBLISHED]: "blue",
  [ItemStatus.MATCHED]: "amber",
  [ItemStatus.CLAIMED]: "amber",
  [ItemStatus.RETURNED]: "green",
  [ItemStatus.TO_DISPOSE]: "red",
  [ItemStatus.ARCHIVED]: "slate",
};

export default function AdminItemDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data: item, isLoading, isError } = useItemFull(id);
  const [verifNotes, setVerifNotes] = useState("");
  const locale = useLocale();
  const categoryLabel = useCategoryLabel();
  const statusLabel = useItemStatusLabel();
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(locale === "uk" ? "uk-UA" : "en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const verifyMutation = useMutation({
    mutationFn: (notes: string) => verifyItem(id, notes),
    onSuccess: (r) => {
      toast.success("Верифіковано", {
        description: `${r.itemNumber} → ${statusLabel(r.status)}`,
      });
      setVerifNotes("");
      qc.invalidateQueries({ queryKey: ["item", id] });
      qc.invalidateQueries({ queryKey: ["items"] });
    },
    onError: (e) =>
      toast.error("Не вдалось верифікувати", {
        description: e instanceof Error ? e.message : undefined,
      }),
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }
  if (isError || !item) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Не вдалось завантажити річ.
      </div>
    );
  }

  const isActive = item.status !== ItemStatus.RETURNED;

  return (
    <div className="space-y-5">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/admin/items">
            <ArrowLeft className="mr-1 h-4 w-4" /> До списку
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-stone-500">
              {item.itemNumber} · {item.trackingCode}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {item.title}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={STATUS_TONE[item.status]}>{statusLabel(item.status)}</Badge>
            {item.isValuable && <Badge tone="amber">Цінна</Badge>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Опис</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-stone-700">
            <p className="whitespace-pre-wrap">{item.description}</p>

            <dl className="grid grid-cols-1 gap-2 border-t border-stone-200 pt-4 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-stone-400" />
                <dt className="text-stone-500">Категорія:</dt>
                <dd>{categoryLabel(item.category)}</dd>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-stone-400" />
                <dt className="text-stone-500">Знайдено:</dt>
                <dd>{fmt(item.foundAt)}</dd>
              </div>
              <div className="flex items-start gap-2 sm:col-span-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 text-stone-400" />
                <dt className="text-stone-500">Локація:</dt>
                <dd>{item.foundLocation?.address}</dd>
              </div>
              {item.retentionDate && (
                <div className="flex items-center gap-2 sm:col-span-2">
                  <dt className="text-stone-500">Зберігаємо до:</dt>
                  <dd>{fmt(item.retentionDate)}</dd>
                </div>
              )}
            </dl>

            {item.isValuable && (item.serialNumber || item.hiddenMarks) && (
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 text-sm">
                <p className="mb-1 font-medium text-amber-900">
                  Прикмети для верифікації
                </p>
                {item.serialNumber && (
                  <p className="text-amber-800">
                    <span className="text-amber-700">SN:</span>{" "}
                    <span className="font-mono">{item.serialNumber}</span>
                  </p>
                )}
                {item.hiddenMarks && (
                  <p className="text-amber-800">
                    <span className="text-amber-700">Приховані:</span>{" "}
                    {item.hiddenMarks}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Фотографії</CardTitle>
          </CardHeader>
          <CardContent>
            {item.photoUrls?.length ? (
              <div className="grid grid-cols-2 gap-2">
                {item.photoUrls.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={url}
                    alt=""
                    className="aspect-square w-full rounded-md border border-stone-200 object-cover"
                  />
                ))}
              </div>
            ) : (
              <div className="flex aspect-square w-full items-center justify-center rounded-md bg-stone-100 text-stone-300">
                <ImageOff className="h-10 w-10" strokeWidth={1.25} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {item.status === ItemStatus.VERIFICATION && (
        <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <div>
            <p className="font-medium">
              Річ позначена як цінна та чекає верифікації
            </p>
            <p className="mt-1 text-amber-800">
              Перевірте серійний номер, приховані прикмети та цілісність речі.
              Після підтвердження вона з’явиться у публічному каталозі.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-amber-900/80">
              Нотатки верифікації (опційно)
            </label>
            <Textarea
              rows={3}
              value={verifNotes}
              onChange={(e) => setVerifNotes(e.target.value)}
              placeholder="Серійник збігається з коробкою. Стан — задовільний. Без видимих пошкоджень."
              className="bg-white"
            />
          </div>
          <Button
            size="sm"
            onClick={() => verifyMutation.mutate(verifNotes)}
            disabled={verifyMutation.isPending}
          >
            <Check className="mr-2 h-4 w-4" />
            {verifyMutation.isPending
              ? "Підтверджуємо…"
              : "Підтвердити та опублікувати"}
          </Button>
        </div>
      )}

      {item.verifiedAt && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-medium">Верифіковано</p>
          <p className="mt-1 text-emerald-800">
            <span className="text-emerald-700">Оператор:</span>{" "}
            {item.verifiedBy ?? "—"} ·{" "}
            <span className="text-emerald-700">Час:</span>{" "}
            {fmt(item.verifiedAt)}
          </p>
          {item.verificationNotes && (
            <p className="mt-2 whitespace-pre-wrap">
              <span className="text-emerald-700">Нотатки:</span>{" "}
              {item.verificationNotes}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button asChild variant="outline">
          <a
            href={itemLabelUrl(item._id)}
            target="_blank"
            rel="noreferrer"
          >
            <Printer className="mr-2 h-4 w-4" /> PDF-етикетка
          </a>
        </Button>
        {isActive && item.status !== ItemStatus.VERIFICATION && (
          <Button asChild>
            <Link href={`/admin/handover/${item._id}`}>
              <Handshake className="mr-2 h-4 w-4" /> Видати річ
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
