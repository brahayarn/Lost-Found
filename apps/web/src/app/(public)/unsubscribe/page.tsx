"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { BellOff, CheckCircle2, AlertCircle } from "lucide-react";
import { unsubscribeByToken } from "@/lib/api";
import { useCategoryLabel } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function UnsubscribePage() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const categoryLabel = useCategoryLabel();
  const [result, setResult] = useState<
    { email: string; category: string } | null
  >(null);

  const mutation = useMutation({
    mutationFn: () => unsubscribeByToken(token),
    onSuccess: (data) => setResult({ email: data.email, category: data.category }),
  });

  if (!token) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-10">
        <Card>
          <CardContent className="space-y-4 p-8 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-amber-500" />
            <h1 className="text-xl font-semibold">Невалідне посилання</h1>
            <p className="text-sm text-stone-500">
              У посиланні відсутній токен. Перевірте лист або зверніться до
              нас.
            </p>
            <Button asChild variant="outline">
              <Link href="/">На головну</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (result) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-10">
        <Card>
          <CardContent className="space-y-4 p-8 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <h1 className="text-xl font-semibold">Підписку скасовано</h1>
            <p className="text-sm text-stone-600">
              Ви більше не отримуватимете листи про категорію{" "}
              <span className="font-medium">
                «{categoryLabel(result.category)}»
              </span>
              .
            </p>
            <p className="text-xs text-stone-400">
              Email: <span className="font-mono">{result.email}</span>
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <Button asChild variant="outline">
                <Link href="/">На головну</Link>
              </Button>
              <Button asChild>
                <Link href="/subscribe">Підписатись знов</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-stone-100">
            <BellOff className="h-5 w-5 text-stone-700" />
          </div>
          <CardTitle>Скасування підписки</CardTitle>
          <CardDescription>
            Підтвердіть, що ви більше не хочете отримувати листи про нові
            знахідки.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-center">
          <Button
            className="w-full"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Скасовуємо…" : "Так, відписатись"}
          </Button>
          {mutation.isError && (
            <p className="text-sm text-red-600">
              {(mutation.error as Error).message}
            </p>
          )}
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Не зараз</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
