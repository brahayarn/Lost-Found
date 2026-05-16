"use client";

import {
  Package,
  CheckCircle2,
  GitMerge,
  ClipboardList,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { useDashboardStats } from "@/hooks/api/use-dashboard-stats";
import { exportItemsCsv, exportItemsXlsx } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/admin/stat-card";
import { ConversionChart } from "@/components/analytics/conversion-chart";
import { CategoryPieChart } from "@/components/analytics/category-pie-chart";
import { LocationsChart } from "@/components/analytics/locations-chart";

export default function AnalyticsPage() {
  const { data, isLoading } = useDashboardStats();

  const download = async (
    fmt: "csv" | "xlsx",
    fn: () => Promise<Blob>,
  ) => {
    try {
      const blob = await fn();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `items-${new Date().toISOString().slice(0, 10)}.${fmt}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${fmt.toUpperCase()} завантажено`);
    } catch (err) {
      toast.error("Не вдалось експортувати", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };
  const handleCsv = () => download("csv", () => exportItemsCsv());
  const handleXlsx = () => download("xlsx", () => exportItemsXlsx());

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Аналітика</h1>
          <p className="text-sm text-stone-500">
            Ключові метрики та динаміка платформи.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleCsv} variant="outline">
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button onClick={handleXlsx} variant="outline">
            <Download className="mr-2 h-4 w-4" /> XLSX
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Всього знахідок"
          value={data?.totalItems}
          icon={Package}
          loading={isLoading}
        />
        <StatCard
          label="Повернуто"
          value={data?.returnedItems}
          icon={CheckCircle2}
          loading={isLoading}
        />
        <StatCard
          label="Конверсія"
          value={data ? `${data.conversionRate}%` : undefined}
          icon={GitMerge}
          loading={isLoading}
        />
        <StatCard
          label="Активні заявки"
          value={data?.openClaims}
          icon={ClipboardList}
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ConversionChart />
        <CategoryPieChart />
      </div>

      <LocationsChart />
    </div>
  );
}
