"use client";

import { Package, ClipboardList, GitMerge, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDashboardStats } from "@/hooks/api/use-dashboard-stats";
import { StatCard } from "@/components/admin/stat-card";
import { LatestMatches } from "@/components/admin/latest-matches";

export default function AdminDashboardPage() {
  const { data, isLoading } = useDashboardStats();
  const t = useTranslations("dashboard");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-stone-500">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Нові за сьогодні"
          value={data?.todayItems}
          icon={Package}
          loading={isLoading}
        />
        <StatCard
          label="Відкриті заявки"
          value={data?.openClaims}
          icon={ClipboardList}
          loading={isLoading}
        />
        <StatCard
          label="Очікують перевірки"
          value={data?.pendingMatches}
          hint="Збіги зі статусом PENDING"
          icon={GitMerge}
          loading={isLoading}
        />
        <StatCard
          label="Конверсія"
          value={data ? `${data.conversionRate}%` : undefined}
          hint={`Повернуто: ${data?.returnedItems ?? 0} / ${data?.totalItems ?? 0}`}
          icon={CheckCircle2}
          loading={isLoading}
        />
      </div>

      <LatestMatches />
    </div>
  );
}
