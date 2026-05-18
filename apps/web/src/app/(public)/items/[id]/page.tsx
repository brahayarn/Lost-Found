"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeft,
  Calendar,
  ImageOff,
  MapPin,
  ShieldAlert,
} from "lucide-react";
import { useItem } from "@/hooks/api/use-item";
import { useCategoryLabel } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PublicItemPage() {
  const { id } = useParams<{ id: string }>();
  const { data: item, isLoading, isError } = useItem(id);
  const t = useTranslations("itemPage");
  const locale = useLocale();
  const categoryLabel = useCategoryLabel();
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(locale === "uk" ? "uk-UA" : "en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  if (isLoading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Skeleton className="h-72 w-full" />
      </main>
    );
  }
  if (isError || !item) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-stone-700">{t("notFound")}</p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/">{t("allItems")}</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const photo = item.photoUrls?.[0];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Button asChild variant="ghost" size="sm" className="-ml-3 mb-3">
        <Link href="/">
          <ArrowLeft className="mr-1 h-4 w-4" /> {t("allItems")}
        </Link>
      </Button>

      <Card className="overflow-hidden">
        <div className="relative aspect-[16/9] w-full bg-stone-100">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt=""
              aria-hidden
              className="h-full w-full scale-110 object-cover blur-md saturate-75"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-stone-300">
              <ImageOff className="h-14 w-14" strokeWidth={1.25} />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-900/15 to-transparent" />
          <Badge
            tone="slate"
            className="absolute left-4 top-4 bg-white/90 text-sm"
          >
            {categoryLabel(item.category)}
          </Badge>
        </div>

        <CardHeader>
          <CardTitle className="text-2xl">
            {item.title || t("untitled")}
          </CardTitle>
          <CardDescription className="font-mono text-xs">
            {item.itemNumber}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-stone-400" />
              <dt className="text-stone-500">{t("found")}</dt>
              <dd>{fmt(item.foundAt)}</dd>
            </div>
            <div className="flex items-start gap-2 sm:col-span-2">
              <MapPin className="mt-0.5 h-3.5 w-3.5 text-stone-400" />
              <dt className="text-stone-500">{t("place")}</dt>
              <dd>{item.foundLocation?.address}</dd>
            </div>
          </dl>

          <div className="rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm">
            <div className="flex items-start gap-2 text-stone-600">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-stone-500" />
              <p>{t("blurNotice")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button asChild variant="outline">
          <Link href="/">{t("otherItems")}</Link>
        </Button>
        <Button asChild size="lg">
          <Link href={`/claim/new?itemId=${item._id}`}>{t("claim")}</Link>
        </Button>
      </div>
    </main>
  );
}
