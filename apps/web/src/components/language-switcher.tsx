"use client";

import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import Cookies from "js-cookie";
import {
  SUPPORTED_LOCALES,
  LOCALE_COOKIE,
  type Locale,
} from "@/i18n/config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LanguageSwitcher({
  compact = false,
}: {
  compact?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("language");

  const onChange = (next: string) => {
    if (next === locale) return;
    Cookies.set(LOCALE_COOKIE, next, {
      expires: 365,
      sameSite: "lax",
      path: "/",
    });
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-1.5">
      {!compact && <Globe className="h-4 w-4 text-stone-500" />}
      <Select value={locale} onValueChange={onChange}>
        <SelectTrigger
          className={compact ? "h-8 w-[140px]" : "h-8 w-[160px]"}
          aria-label={t("label")}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LOCALES.map((l: Locale) => (
            <SelectItem key={l} value={l}>
              {t(l)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
