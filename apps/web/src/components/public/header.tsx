"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/language-switcher";

export function PublicHeader() {
  const t = useTranslations("header");
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-stone-50/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 md:px-6">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-stone-900"
        >
          {t("brand")}
        </Link>

        <form
          action="/"
          className="ml-auto hidden flex-1 max-w-md md:block"
          role="search"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <Input name="q" placeholder={t("search")} className="pl-9 bg-white" />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <LanguageSwitcher compact />
          <Button asChild variant="ghost" size="sm">
            <Link href="/subscribe">
              <Bell className="mr-1 h-4 w-4" /> {t("subscribe")}
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">{t("login")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
