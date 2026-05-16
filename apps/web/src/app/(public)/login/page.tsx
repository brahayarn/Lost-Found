"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
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
                      <Input
                        type="password"
                        autoComplete="current-password"
                        placeholder="••••••••"
                        {...field}
                      />
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
              На головну
            </Link>
          </p>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-stone-400">
        Dev seed: <span className="font-mono">admin@lf.com</span> /{" "}
        <span className="font-mono">password123</span>
      </p>
    </main>
  );
}
