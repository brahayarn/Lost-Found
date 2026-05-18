"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { ImageOff, MapPin, Calendar, Tag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCategoryLabel } from "@/lib/categories";
import type { IItem } from "@lf/shared";

export function PublicItemCard({ item }: { item: IItem }) {
  const locale = useLocale();
  const categoryLabel = useCategoryLabel();
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "uk" ? "uk-UA" : "en-US", {
      day: "2-digit",
      month: "long",
    });
  const photo = item.photoUrls?.[0];

  return (
    <Link
      href={`/items/${item._id}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:rounded-xl"
    >
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
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
            <ImageOff className="h-10 w-10" strokeWidth={1.25} />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-900/10 to-transparent" />
        <Badge tone="slate" className="absolute left-3 top-3 bg-white/90">
          <Tag className="mr-1 h-3 w-3" />
          {categoryLabel(item.category)}
        </Badge>
      </div>

      <CardContent className="space-y-2 p-4 pt-4">
        <p className="text-xs font-mono text-stone-500">{item.itemNumber}</p>
        <div className="flex items-center gap-1.5 text-sm text-stone-700">
          <MapPin className="h-3.5 w-3.5 text-stone-400" />
          <span className="line-clamp-1">{item.foundLocation?.address}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-stone-500">
          <Calendar className="h-3.5 w-3.5 text-stone-400" />
          {formatDate(item.foundAt)}
        </div>
      </CardContent>
    </Card>
    </Link>
  );
}
