"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Check, X, Handshake } from "lucide-react";
import { fetchMatch, confirmMatch, rejectMatch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MatchDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const { data: match, isLoading, isError } = useQuery({
    queryKey: ["match", id],
    queryFn: () => fetchMatch(id),
  });

  const confirmMut = useMutation({
    mutationFn: () => confirmMatch(id),
    onSuccess: () => {
      toast.success("Збіг підтверджено");
      qc.invalidateQueries({ queryKey: ["match", id] });
      qc.invalidateQueries({ queryKey: ["matches"] });
    },
    onError: (e) =>
      toast.error("Не вдалось", {
        description: e instanceof Error ? e.message : undefined,
      }),
  });
  const rejectMut = useMutation({
    mutationFn: () => rejectMatch(id),
    onSuccess: () => {
      toast.success("Збіг відхилено");
      qc.invalidateQueries({ queryKey: ["match", id] });
      qc.invalidateQueries({ queryKey: ["matches"] });
    },
    onError: (e) =>
      toast.error("Не вдалось", {
        description: e instanceof Error ? e.message : undefined,
      }),
  });

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }
  if (isError || !match) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Збіг не знайдено.
      </div>
    );
  }

  const item = match.itemId;
  const claim = match.claimId;
  const isPending = match.status === "PENDING";

  return (
    <div className="space-y-5">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/admin/matches">
            <ArrowLeft className="mr-1 h-4 w-4" /> До списку
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-stone-500">
              Match #{match._id.slice(-8)}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Зіставлення знахідки та заявки
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              Score{" "}
              <span className="font-mono text-stone-800">
                {match.score.toFixed(2)}
              </span>
            </p>
          </div>
          <Badge
            tone={
              match.status === "CONFIRMED"
                ? "green"
                : match.status === "REJECTED"
                  ? "red"
                  : "amber"
            }
          >
            {match.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Знахідка</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-700">
            {item ? (
              <>
                <p>
                  <span className="text-stone-500">№:</span>{" "}
                  <Link
                    href={`/admin/items/${item._id}`}
                    className="font-mono text-blue-700 underline-offset-2 hover:underline"
                  >
                    {item.itemNumber}
                  </Link>
                </p>
                <p>
                  <span className="text-stone-500">Назва:</span> {item.title}
                </p>
                <p>
                  <span className="text-stone-500">Категорія:</span>{" "}
                  {item.category}
                </p>
                <p>
                  <span className="text-stone-500">Статус:</span> {item.status}
                </p>
                {item.photoUrls && item.photoUrls.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    {item.photoUrls.slice(0, 3).map((url) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        key={url}
                        src={url}
                        alt=""
                        className="aspect-square w-full rounded-md border border-stone-200 object-cover"
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-stone-400">Знахідку видалено.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Заявка</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-stone-700">
            {claim ? (
              <>
                <p>
                  <span className="text-stone-500">№:</span>{" "}
                  <Link
                    href={`/admin/claims/${claim._id}`}
                    className="font-mono text-blue-700 underline-offset-2 hover:underline"
                  >
                    {claim.claimNumber}
                  </Link>
                </p>
                <p>
                  <span className="text-stone-500">Email:</span>{" "}
                  {claim.claimerEmail}
                </p>
                <p>
                  <span className="text-stone-500">Статус:</span> {claim.status}
                </p>
                <div>
                  <p className="text-stone-500">Опис від заявника:</p>
                  <p className="mt-1 whitespace-pre-wrap rounded-md bg-stone-50 p-3">
                    {claim.description}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-stone-400">Заявку видалено.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {match.reasons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Чому система запропонувала цей збіг
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-2">
              {match.reasons.map((r) => (
                <li
                  key={r}
                  className="rounded-full border border-stone-200 bg-white px-3 py-1 font-mono text-xs text-stone-600"
                >
                  {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {isPending && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => rejectMut.mutate()}
            disabled={rejectMut.isPending || confirmMut.isPending}
          >
            <X className="mr-2 h-4 w-4" />
            Відхилити
          </Button>
          <Button
            onClick={() => confirmMut.mutate()}
            disabled={confirmMut.isPending || rejectMut.isPending}
          >
            <Check className="mr-2 h-4 w-4" />
            Підтвердити збіг
          </Button>
          {item && (
            <Button asChild>
              <Link href={`/admin/handover/${item._id}`}>
                <Handshake className="mr-2 h-4 w-4" />
                Перейти до видачі
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
