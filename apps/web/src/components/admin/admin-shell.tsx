"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarNav } from "./sidebar-nav";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { tokenStorage } from "@/lib/auth/token";
import { logoutApi } from "@/lib/api";
import { LanguageSwitcher } from "@/components/language-switcher";

function SidebarBrand() {
  return (
    <div className="border-b border-stone-200 px-5 py-4">
      <Link href="/admin" className="text-base font-semibold tracking-tight">
        L&amp;F Admin
      </Link>
      <p className="mt-1 text-xs text-stone-500">Робочий простір</p>
    </div>
  );
}

function UserBlock() {
  const { data: user } = useCurrentUser();
  const router = useRouter();
  const qc = useQueryClient();
  const t = useTranslations("common");

  const logout = async () => {
    const refresh = tokenStorage.getRefresh();
    tokenStorage.clear();
    qc.clear();
    // fire-and-forget — навіть якщо API недоступне, локальний стан вже очищений
    if (refresh) {
      try {
        await logoutApi(refresh);
      } catch {
        // ігноруємо помилки відкликання — токени все одно витерті
      }
    }
    router.push("/");
  };

  return (
    <div className="border-t border-stone-200 px-4 py-3">
      {user ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-stone-900">
                {user.name}
              </p>
              <p className="truncate text-xs text-stone-500">{user.email}</p>
            </div>
            <Badge tone="slate">{user.role}</Badge>
          </div>
          <LanguageSwitcher />
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={logout}
          >
            <LogOut className="mr-2 h-3.5 w-3.5" /> {t("logout")}
          </Button>
        </div>
      ) : (
        <p className="text-xs text-stone-400">v0.1</p>
      )}
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-stone-200 bg-white md:flex">
        <SidebarBrand />
        <nav className="flex-1 overflow-y-auto py-3">
          <SidebarNav />
        </nav>
        <UserBlock />
      </aside>

      {/* mobile topbar */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-3 border-b border-stone-200 bg-white px-4 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
              <SheetTitle className="sr-only">Навігація</SheetTitle>
              <SidebarBrand />
              <nav className="flex-1 overflow-y-auto py-3">
                <SidebarNav onNavigate={() => setOpen(false)} />
              </nav>
              <UserBlock />
            </SheetContent>
          </Sheet>
          <Link href="/admin" className="text-sm font-semibold">
            L&amp;F Admin
          </Link>
        </header>

        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
