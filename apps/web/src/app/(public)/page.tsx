import { getTranslations } from "next-intl/server";
import { Search } from "lucide-react";
import { ItemGrid } from "@/components/public/item-grid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim() || undefined;
  const t = await getTranslations("home");

  return (
    <main>
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center md:px-6 md:py-24">
          <h1 className="text-4xl font-semibold tracking-tight text-stone-900 md:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-4 text-base text-stone-500 md:text-lg">
            {t("heroSubtitle")}
          </p>

          <div className="mt-6 flex justify-center">
            <Button asChild variant="outline" size="sm">
              <a href="/claim/new">{t("lostMyItem")}</a>
            </Button>
          </div>

          <form action="/" className="mt-8 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input
                name="q"
                defaultValue={q}
                placeholder={t("searchPlaceholder")}
                className="h-12 rounded-full border-stone-300 bg-stone-50 pl-11 text-base"
              />
            </div>
            <Button type="submit" size="lg" className="h-12 rounded-full px-8">
              {t("search")}
            </Button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {q ? t("searchResults") : t("latest")}
            </h2>
            <p className="text-sm text-stone-500">{t("photoHidden")}</p>
          </div>
        </div>
        <ItemGrid search={q} />
      </section>
    </main>
  );
}
