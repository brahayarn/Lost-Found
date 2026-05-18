"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { ItemCategory } from "@lf/shared";
import { createSubscription } from "@/lib/api";
import { useCategoryOptions } from "@/lib/categories";
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
  const t = useTranslations("subscribe");
  const categoryOptions = useCategoryOptions();
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
      toast.success(t("toastSuccess"), {
        description: t("toastSuccessDesc"),
      });
      setEmail("");
      setKeywords("");
    },
    onError: (e) =>
      toast.error(t("toastFailed"), {
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
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!email) {
                toast.error(t("emailRequired"));
                return;
              }
              mutation.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                {t("email")}
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
                {t("category")}
              </label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as ItemCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-stone-700">
                {t("keywords")}
              </label>
              <Input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder={t("keywordsPlaceholder")}
              />
              <p className="mt-1 text-xs text-stone-500">{t("keywordsHint")}</p>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? t("submitting") : t("submit")}
            </Button>
            <p className="text-center text-xs text-stone-500">
              {t("unsubscribeHint")}
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
