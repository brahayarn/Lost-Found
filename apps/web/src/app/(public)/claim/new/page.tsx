"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import {
  CreateClaimSchema,
  type CreateClaimDto,
  ItemCategory,
} from "@lf/shared";
import { createClaim, type CreateClaimResponse } from "@/lib/api";
import { useCategoryOptions } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

export default function NewClaimPage() {
  const t = useTranslations("claim");
  const tCommon = useTranslations("common");
  const categoryOptions = useCategoryOptions();
  const [success, setSuccess] = useState<CreateClaimResponse | null>(null);

  const form = useForm<CreateClaimDto>({
    resolver: zodResolver(CreateClaimSchema),
    defaultValues: {
      claimerEmail: "",
      description: "",
      category: ItemCategory.OTHER,
      lostAt: new Date().toISOString(),
      lostLocation: { address: "" },
    },
  });

  const mutation = useMutation<CreateClaimResponse, Error, CreateClaimDto>({
    mutationFn: createClaim,
    onSuccess: (res) => {
      setSuccess(res);
      toast.success(t("toastAccepted"), { description: res.claimNumber });
    },
    onError: (err) => {
      toast.error(t("toastFailed"), { description: err.message });
    },
  });

  if (success) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 md:py-24">
        <Card>
          <CardContent className="space-y-4 p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t("successTitle")}
            </h1>
            <p className="text-stone-600">
              {t.rich("successDescription", {
                code: () => (
                  <span className="font-mono font-semibold">
                    {success.claimNumber}
                  </span>
                ),
              })}
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button asChild variant="outline">
                <Link href="/">{tCommon("home")}</Link>
              </Button>
              <Button onClick={() => setSuccess(null)}>
                {t("submitAnother")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10 md:py-16">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-stone-500">{t("subtitle")}</p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((dto) => mutation.mutate(dto))}
          className="space-y-5"
        >
          <Card>
            <CardHeader>
              <CardTitle>{t("contact")}</CardTitle>
              <CardDescription>{t("contactDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="claimerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("whatLost")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("category")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("description")}</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder={t("descriptionPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("whereWhen")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="lostLocation.address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("place")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("placePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lostAt"
                render={({ field }) => {
                  const current = field.value ? new Date(field.value) : new Date();
                  const hh = String(current.getHours()).padStart(2, "0");
                  const mm = String(
                    Math.floor(current.getMinutes() / 5) * 5,
                  ).padStart(2, "0");
                  const updateDate = (date: Date | undefined) => {
                    if (!date) return;
                    const next = new Date(date);
                    next.setHours(current.getHours(), current.getMinutes(), 0, 0);
                    field.onChange(next.toISOString());
                  };
                  const updateTime = (hour: string, minute: string) => {
                    const next = new Date(current);
                    next.setHours(Number(hour), Number(minute), 0, 0);
                    field.onChange(next.toISOString());
                  };
                  return (
                    <FormItem>
                      <FormLabel>{t("dateAndTime")}</FormLabel>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px_120px]">
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-stone-500">
                            {t("date")}
                          </span>
                          <DatePicker
                            value={field.value ? current : undefined}
                            onChange={updateDate}
                            placeholder={t("pickDate")}
                            disabled={(d) => d > new Date()}
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-stone-500">
                            {t("hour")}
                          </span>
                          <Select
                            value={hh}
                            onValueChange={(v) => updateTime(v, mm)}
                          >
                            <SelectTrigger aria-label={t("hour")}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {Array.from({ length: 24 }, (_, i) =>
                                String(i).padStart(2, "0"),
                              ).map((h) => (
                                <SelectItem key={h} value={h}>
                                  {h}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-stone-500">
                            {t("minutes")}
                          </span>
                          <Select
                            value={mm}
                            onValueChange={(v) => updateTime(hh, v)}
                          >
                            <SelectTrigger aria-label={t("minutes")}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                              {Array.from({ length: 12 }, (_, i) =>
                                String(i * 5).padStart(2, "0"),
                              ).map((m) => (
                                <SelectItem key={m} value={m}>
                                  {m}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? t("submitting") : t("submit")}
            </Button>
          </div>
        </form>
      </Form>
    </main>
  );
}
