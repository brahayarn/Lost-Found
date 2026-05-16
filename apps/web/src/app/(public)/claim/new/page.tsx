"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import {
  CreateClaimSchema,
  type CreateClaimDto,
  ItemCategory,
} from "@lf/shared";
import { createClaim, type CreateClaimResponse } from "@/lib/api";
import { CATEGORY_OPTIONS } from "@/lib/categories";
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

const toIsoLocal = (d: Date) => {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
};

export default function NewClaimPage() {
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
      toast.success("Заявку прийнято", { description: res.claimNumber });
    },
    onError: (err) => {
      toast.error("Не вдалось відправити", { description: err.message });
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
              Заявку прийнято
            </h1>
            <p className="text-stone-600">
              Ваша заявка{" "}
              <span className="font-mono font-semibold">
                {success.claimNumber}
              </span>{" "}
              зареєстрована. Ми повідомимо вас на email, якщо знайдемо збіг із
              нашими знахідками.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button asChild variant="outline">
                <Link href="/">На головну</Link>
              </Button>
              <Button onClick={() => setSuccess(null)}>Подати ще одну</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10 md:py-16">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Подати заявку на втрачену річ
        </h1>
        <p className="mt-1 text-stone-500">
          Опишіть річ якомога детальніше — це підвищує шанс знайти її.
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((dto) => mutation.mutate(dto))}
          className="space-y-5"
        >
          <Card>
            <CardHeader>
              <CardTitle>Контакт</CardTitle>
              <CardDescription>
                На цей email ми надішлемо повідомлення, якщо знайдемо збіг.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="claimerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
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
              <CardTitle>Що саме втратили</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Категорія</FormLabel>
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
                        {CATEGORY_OPTIONS.map((opt) => (
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
                    <FormLabel>Опис</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Чорний рюкзак з конспектами, парасолькою та зарядним пристроєм…"
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
              <CardTitle>Де і коли</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="lostLocation.address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Місце</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="вул. Бандери 12, біля корпусу №3"
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Дата і час</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        value={
                          field.value
                            ? toIsoLocal(new Date(field.value))
                            : ""
                        }
                        onChange={(e) => {
                          const v = e.target.value;
                          field.onChange(v ? new Date(v).toISOString() : "");
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
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
              {mutation.isPending ? "Відправка…" : "Подати заявку"}
            </Button>
          </div>
        </form>
      </Form>
    </main>
  );
}
