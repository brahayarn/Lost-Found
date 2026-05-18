"use client";

import Link from "next/link";
import { Check, X, ArrowRight, Handshake } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMatches } from "@/hooks/api/use-matches";
import { confirmMatch, rejectMatch, type MatchProposalApi } from "@/lib/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useMatchStatusLabel, useScoreLabel } from "@/lib/labels";

function MatchActions({ match }: { match: MatchProposalApi }) {
  const qc = useQueryClient();
  const statusLabel = useMatchStatusLabel();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["matches"] });
    qc.invalidateQueries({ queryKey: ["analytics"] });
  };

  const confirm = useMutation({
    mutationFn: () => confirmMatch(match._id),
    onSuccess: () => {
      toast.success("Збіг підтверджено", {
        description: "Готовий до видачі",
      });
      invalidate();
    },
    onError: (err: Error) =>
      toast.error("Помилка", { description: err.message }),
  });

  const reject = useMutation({
    mutationFn: () => rejectMatch(match._id),
    onSuccess: () => {
      toast.success("Збіг відхилено");
      invalidate();
    },
    onError: (err: Error) =>
      toast.error("Помилка", { description: err.message }),
  });

  const busy = confirm.isPending || reject.isPending;

  if (match.status === "CONFIRMED") {
    return (
      <Button asChild size="sm">
        <Link
          href={`/admin/handover/${match.itemId?._id}?claimId=${match.claimId?._id}`}
        >
          <Handshake className="mr-1 h-3.5 w-3.5" /> Видати
        </Link>
      </Button>
    );
  }

  if (match.status !== "PENDING") {
    return <Badge tone="slate">{statusLabel(match.status)}</Badge>;
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => reject.mutate()}
        disabled={busy}
      >
        <X className="mr-1 h-3.5 w-3.5" /> Відхилити
      </Button>
      <Button size="sm" onClick={() => confirm.mutate()} disabled={busy}>
        <Check className="mr-1 h-3.5 w-3.5" /> Підтвердити
      </Button>
    </div>
  );
}

export function LatestMatches() {
  const { data, isLoading, isError } = useMatches({
    page: 1,
    pageSize: 10,
  });
  const statusLabel = useMatchStatusLabel();
  const scoreLabel = useScoreLabel();

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div>
          <CardTitle>Збіги</CardTitle>
          <CardDescription>
            Підтвердьте відповідність або відхиліть пропозицію
          </CardDescription>
        </div>
        <Badge tone="amber">{data?.total ?? 0} всього</Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))
        ) : isError ? (
          <p className="text-sm text-red-600">Помилка завантаження.</p>
        ) : !data || data.data.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
            Поки що немає збігів.
          </p>
        ) : (
          data.data.map((m) => (
            <div
              key={m._id}
              className="rounded-lg border border-stone-200 bg-stone-50/50 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/admin/matches/${m._id}`}
                    className="flex items-center gap-2 text-sm hover:underline"
                  >
                    <span className="font-mono text-xs text-stone-500">
                      {m.itemId?.itemNumber}
                    </span>
                    <span className="font-medium text-stone-900 truncate">
                      {m.itemId?.title ?? "—"}
                    </span>
                  </Link>
                  <div className="mt-1 flex items-center gap-2 text-sm text-stone-600">
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                    <span className="line-clamp-1">
                      {m.claimId?.description ?? "—"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge tone="slate">
                      {scoreLabel} {m.score.toFixed(2)}
                    </Badge>
                    <Badge
                      tone={
                        m.status === "CONFIRMED"
                          ? "green"
                          : m.status === "REJECTED"
                            ? "red"
                            : "amber"
                      }
                    >
                      {statusLabel(m.status)}
                    </Badge>
                    <span className="text-xs text-stone-500">
                      {m.claimId?.claimerEmail}
                    </span>
                  </div>
                </div>
                <MatchActions match={m} />
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
