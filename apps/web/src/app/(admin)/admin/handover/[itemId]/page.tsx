"use client";

import { useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import type SignatureCanvas from "react-signature-canvas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Eraser, ImageOff } from "lucide-react";
import { useItemFull } from "@/hooks/api/use-item";
import {
  postHandover,
  type HandoverResponse,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCategoryLabel } from "@/lib/categories";
import { useItemStatusLabel } from "@/lib/labels";

// SignatureCanvas використовує canvas API → SSR off
const SigCanvas = dynamic(() => import("react-signature-canvas"), {
  ssr: false,
}) as unknown as typeof SignatureCanvas;

interface HandoverBody {
  signature: string;
  claimId?: string;
  notes?: string;
}

export default function HandoverPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const search = useSearchParams();
  const claimId = search.get("claimId") ?? undefined;
  const router = useRouter();
  const qc = useQueryClient();

  const sigRef = useRef<SignatureCanvas | null>(null);
  const [notes, setNotes] = useState("");
  const [empty, setEmpty] = useState(true);
  const categoryLabel = useCategoryLabel();
  const itemStatusLabel = useItemStatusLabel();

  const { data: item, isLoading, isError } = useItemFull(itemId);

  const mutation = useMutation<HandoverResponse, Error, HandoverBody>({
    mutationFn: (body) => postHandover(itemId, body),
    onSuccess: (res) => {
      toast.success("Річ успішно видана", {
        description: `Акт оформлено: ${res.itemNumber}`,
      });
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["claims"] });
      qc.invalidateQueries({ queryKey: ["matches"] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      router.push("/admin/items");
    },
    onError: (err) => {
      toast.error("Не вдалось оформити видачу", { description: err.message });
    },
  });

  const handleClear = () => {
    sigRef.current?.clear();
    setEmpty(true);
  };

  const handleSubmit = () => {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast.error("Підпис обов'язковий");
      return;
    }
    const signature = sigRef.current
      .getCanvas()
      .toDataURL("image/png");
    mutation.mutate({ signature, claimId, notes: notes.trim() || undefined });
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/admin/items">
            <ArrowLeft className="mr-1 h-4 w-4" /> До списку
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Видача речі</h1>
        <p className="text-sm text-stone-500">
          Зафіксуйте підпис власника та підтвердіть передачу. Це створить акт у
          базі та змінить статус речі на «Повернено».
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Інформація про річ</CardTitle>
          <CardDescription>
            Перевірте дані перед оформленням видачі.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : isError || !item ? (
            <p className="text-sm text-red-600">Не вдалось завантажити річ.</p>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-md bg-stone-100">
                {item.photoUrls?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.photoUrls[0]}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-stone-300">
                    <ImageOff className="h-8 w-8" strokeWidth={1.25} />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="font-mono text-xs text-stone-500">
                  {item.itemNumber}
                </p>
                <p className="text-base font-semibold">{item.title}</p>
                <p className="text-sm text-stone-600 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Badge tone="slate">{categoryLabel(item.category)}</Badge>
                  <Badge
                    tone={item.status === "RETURNED" ? "green" : "blue"}
                  >
                    {itemStatusLabel(item.status)}
                  </Badge>
                  {claimId && <Badge tone="amber">claim {claimId.slice(-6)}</Badge>}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Підпис власника</CardTitle>
          <CardDescription>
            Розпишіться у полі нижче (миша / стилус / палець на тачскрині).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-stone-300 bg-stone-100/60">
            <SigCanvas
              ref={(r) => {
                sigRef.current = r;
              }}
              penColor="#1c1917"
              onEnd={() =>
                setEmpty(sigRef.current ? sigRef.current.isEmpty() : true)
              }
              canvasProps={{
                className: "block w-full h-56 rounded-lg",
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={empty}
            >
              <Eraser className="mr-1 h-3.5 w-3.5" />
              Очистити
            </Button>
            <p className="text-xs text-stone-500">
              {empty ? "Поле порожнє" : "Готово до підтвердження"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="handover-notes">Примітки (опціонально)</Label>
            <Textarea
              id="handover-notes"
              rows={2}
              placeholder="Власник пред'явив паспорт, серія АА…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" asChild>
          <Link href="/admin/items">Скасувати</Link>
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={mutation.isPending || isLoading || isError}
        >
          {mutation.isPending ? "Оформляємо…" : "Підтвердити видачу"}
        </Button>
      </div>
    </div>
  );
}
