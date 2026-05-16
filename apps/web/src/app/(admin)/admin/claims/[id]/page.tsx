"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Mail,
  Phone,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClaimStatus } from "@lf/shared";
import {
  fetchClaim,
  updateClaimStatus,
  confirmClaimIdentity,
  listMatches,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_TONE: Record<
  ClaimStatus,
  "slate" | "blue" | "amber" | "green" | "red"
> = {
  [ClaimStatus.NEW]: "blue",
  [ClaimStatus.PROCESSING]: "amber",
  [ClaimStatus.MATCHED]: "amber",
  [ClaimStatus.READY_FOR_HANDOVER]: "green",
  [ClaimStatus.CLOSED]: "slate",
  [ClaimStatus.REJECTED]: "red",
};

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function AdminClaimDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const claimQ = useQuery({
    queryKey: ["claim", id],
    queryFn: () => fetchClaim(id),
  });

  // Беремо всі матчі і фільтруємо по claimId — API сам фільтра не приймає,
  // але матчів зазвичай небагато.
  const matchesQ = useQuery({
    queryKey: ["matches", "for-claim", id],
    queryFn: () => listMatches({ pageSize: 100 }),
  });

  const statusMutation = useMutation({
    mutationFn: (status: ClaimStatus) => updateClaimStatus(id, status),
    onSuccess: (r) => {
      toast.success("Статус оновлено", {
        description: `${r.claimNumber} → ${r.status}`,
      });
      qc.invalidateQueries({ queryKey: ["claim", id] });
      qc.invalidateQueries({ queryKey: ["claims"] });
    },
    onError: (e) =>
      toast.error("Не вдалось", {
        description: e instanceof Error ? e.message : undefined,
      }),
  });

  const identityMutation = useMutation({
    mutationFn: () => confirmClaimIdentity(id),
    onSuccess: (r) => {
      toast.success("Особу підтверджено", {
        description: `${r.claimNumber}`,
      });
      qc.invalidateQueries({ queryKey: ["claim", id] });
    },
    onError: (e) =>
      toast.error("Не вдалось", {
        description: e instanceof Error ? e.message : undefined,
      }),
  });

  if (claimQ.isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }
  if (claimQ.isError || !claimQ.data) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Не вдалось завантажити заявку.
      </div>
    );
  }

  const claim = claimQ.data;
  const claimMatches =
    matchesQ.data?.data.filter((m) => m.claimId?._id === claim._id) ?? [];

  return (
    <div className="space-y-5">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/admin/claims">
            <ArrowLeft className="mr-1 h-4 w-4" /> До списку
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-stone-500">
              {claim.claimNumber}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Заявка від {claim.claimerEmail}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={STATUS_TONE[claim.status]}>{claim.status}</Badge>
            {claim.identityConfirmed && (
              <Badge tone="green">
                <ShieldCheck className="mr-1 h-3 w-3" /> Особу підтверджено
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Опис втрати</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-stone-700">
            <p className="whitespace-pre-wrap">{claim.description}</p>

            <dl className="grid grid-cols-1 gap-2 border-t border-stone-200 pt-4 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-stone-400" />
                <dt className="text-stone-500">Категорія:</dt>
                <dd>{claim.category}</dd>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-stone-400" />
                <dt className="text-stone-500">Втрачено:</dt>
                <dd>{fmt(claim.lostAt)}</dd>
              </div>
              <div className="flex items-start gap-2 sm:col-span-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 text-stone-400" />
                <dt className="text-stone-500">Локація:</dt>
                <dd>{claim.lostLocation?.address}</dd>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-stone-400" />
                <dt className="text-stone-500">Email:</dt>
                <dd>{claim.claimerEmail}</dd>
              </div>
              {claim.claimerPhone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-stone-400" />
                  <dt className="text-stone-500">Телефон:</dt>
                  <dd>{claim.claimerPhone}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Дії</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-stone-500">
                Статус
              </p>
              <Select
                value={claim.status}
                onValueChange={(v) =>
                  statusMutation.mutate(v as ClaimStatus)
                }
                disabled={statusMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(ClaimStatus).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!claim.identityConfirmed && (
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-stone-500">
                  Верифікація
                </p>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => identityMutation.mutate()}
                  disabled={identityMutation.isPending}
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  {identityMutation.isPending
                    ? "Підтверджуємо…"
                    : "Підтвердити особу"}
                </Button>
                <p className="mt-2 text-xs text-stone-500">
                  Обов’язково перед видачею цінних речей.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Знайдені збіги ({claimMatches.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {matchesQ.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : claimMatches.length === 0 ? (
            <p className="text-sm text-stone-500">
              Поки що системних збігів немає.
            </p>
          ) : (
            <ul className="divide-y divide-stone-200">
              {claimMatches.map((m) => (
                <li
                  key={m._id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-900">
                      {m.itemId?.title ?? "—"}
                    </p>
                    <p className="font-mono text-xs text-stone-500">
                      {m.itemId?.itemNumber} · score {m.score.toFixed(2)}
                    </p>
                  </div>
                  <Badge
                    tone={
                      m.status === "CONFIRMED"
                        ? "green"
                        : m.status === "REJECTED"
                          ? "red"
                          : "amber"
                    }
                  >
                    {m.status}
                  </Badge>
                  {m.itemId && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/items/${m.itemId._id}`}>
                        Знахідка →
                      </Link>
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
