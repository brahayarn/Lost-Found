"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Lock, Eye, EyeOff } from "lucide-react";
import { LoginSchema, type LoginDto, type AuthLoginResponse } from "@lf/shared";
import { login } from "@/lib/api";
import { tokenStorage } from "@/lib/auth/token";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/admin";
  const qc = useQueryClient();
  const t = useTranslations("login");
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginDto>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation<AuthLoginResponse, Error, LoginDto>({
    mutationFn: login,
    onSuccess: (res) => {
      tokenStorage.setPair(res.accessToken, res.refreshToken);
      qc.setQueryData(["auth", "me"], res.user);
      qc.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success(t("welcome", { name: res.user.name }));
      router.push(next);
    },
    onError: (err) => {
      toast.error(t("failed"), { description: err.message });
    },
  });

  return (
    <main className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center px-4 py-10">
      <Card>
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-stone-100">
            <Lock className="h-4 w-4 text-stone-700" />
          </div>
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((dto) => mutation.mutate(dto))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="username"
                        placeholder="admin@lf.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("password")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder="••••••••"
                          className="pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-400"
                          aria-label={
                            showPassword
                              ? "Сховати пароль"
                              : "Показати пароль"
                          }
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? t("submitting") : t("submit")}
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-xs text-stone-500">
            <Link href="/" className="underline-offset-2 hover:underline">
              {t("backHome")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
