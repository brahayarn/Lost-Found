"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { ItemCategory } from "@lf/shared";
import { createSubscription } from "@/lib/api";
import { CATEGORY_OPTIONS } from "@/lib/categories";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SubscribePage() {
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState<ItemCategory>(ItemCategory.OTHER);
  const [keywords, setKeywords] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createSubscription({
        email,
        category,
        keywords: keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      toast.success("Підписку оформлено", {
        description:
          "Як тільки з'явиться річ за вашими параметрами — надішлемо лист.",
      });
      setEmail("");
      setKeywords("");
    },
    onError: (e) =>
      toast.error("Не вдалось підписатись", {
        description: e instanceof Error ? e.message : undefined,
      }),
  });

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <Card>
        <CardHeader>
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-stone-100">
            <Bell className="h-5 w-5 text-stone-700" />
          </div>
          <CardTitle>Сповіщення про нові знахідки</CardTitle>
          <CardDescription>
            Підпишіться — і отримаєте лист, як тільки з’явиться річ, що
            підходить під опис.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!email) {
                toast.error("Введіть email");
                return;
              }
              mutation.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                Категорія
              </label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as ItemCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                Ключові слова (опційно)
              </label>
              <Input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="рюкзак, чорний, nike"
              />
              <p className="mt-1 text-xs text-stone-500">
                Через кому. Якщо порожньо — отримаєте лист про будь-яку нову
                знахідку цієї категорії.
              </p>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Підписуємо…" : "Підписатися"}
            </Button>
            <p className="text-center text-xs text-stone-500">
              Скасувати підписку можна написавши нам на пошту.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
