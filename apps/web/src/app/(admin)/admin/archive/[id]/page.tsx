"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Lock } from "lucide-react";
import { fetchHandoverAct } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function HandoverActDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: act, isLoading, isError } = useQuery({
    queryKey: ["handover-act", id],
    queryFn: () => fetchHandoverAct(id),
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (isError || !act) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Акт не знайдено.
      </div>
    );
  }

  const item = typeof act.itemId === "object" ? act.itemId : null;
  const claim = act.claimId && typeof act.claimId === "object" ? act.claimId : null;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/admin/archive">
            <ArrowLeft className="mr-1 h-4 w-4" /> До архіву
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-stone-500">
              Акт #{act._id.slice(-8)}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Акт видачі речі
            </h1>
            <p className="mt-1 text-sm text-stone-500">{fmt(act.handoverDate)}</p>
          </div>
          <Badge tone="slate">
            <Lock className="mr-1 h-3 w-3" /> Незмінний
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Знахідка</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-stone-700">
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
              {item.foundLocation && (
                <p>
                  <span className="text-stone-500">Знайдено:</span>{" "}
                  {item.foundLocation.address}
                </p>
              )}
              {item.foundAt && (
                <p>
                  <span className="text-stone-500">Дата знахідки:</span>{" "}
                  {fmt(item.foundAt)}
                </p>
              )}
            </>
          ) : (
            <p className="text-stone-400">Знахідку видалено.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Заявник</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-stone-700">
          {claim ? (
            <>
              <p>
                <span className="text-stone-500">Заявка:</span>{" "}
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
              {claim.description && (
                <p className="whitespace-pre-wrap text-stone-700">
                  <span className="text-stone-500">Опис від заявника:</span>{" "}
                  {claim.description}
                </p>
              )}
            </>
          ) : (
            <p className="text-stone-400">
              Видача без заявки (особиста ідентифікація).
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Видача</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-stone-700">
          <p>
            <span className="text-stone-500">Оператор:</span>{" "}
            {act.operatorName}
          </p>
          {act.notes && (
            <p className="whitespace-pre-wrap">
              <span className="text-stone-500">Нотатки:</span> {act.notes}
            </p>
          )}
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-stone-500">
              Підпис отримувача
            </p>
            <div className="rounded-md border border-stone-200 bg-white p-2">
              {act.signature?.startsWith("data:image/") ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={act.signature}
                  alt="Підпис"
                  className="mx-auto h-32 object-contain"
                />
              ) : (
                <p className="font-mono text-xs text-stone-500">
                  {act.signature?.slice(0, 80)}…
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
