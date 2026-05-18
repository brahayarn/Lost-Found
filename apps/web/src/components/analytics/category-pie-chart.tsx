"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategoryAnalytics } from "@/hooks/api/use-dashboard-stats";
import { useCategoryLabel } from "@/lib/categories";

// Стримана палітра — приглушені, землисті тони у стилі застосунку
const COLORS = [
  "#1c1917", // stone-900 — графіт
  "#3f6212", // lime-800 — олива
  "#92400e", // amber-800 — теракота
  "#1e3a8a", // blue-900 — індиго
  "#7c2d12", // orange-900 — паленa глина
  "#0f766e", // teal-700 — приглушений бірюзовий
  "#78716c", // stone-500 — світло-сірий
];

export function CategoryPieChart() {
  const { data, isLoading } = useCategoryAnalytics();
  const categoryLabel = useCategoryLabel();
  const localized = data?.map((d) => ({ ...d, name: categoryLabel(d.name) }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Розподіл за категоріями</CardTitle>
        <CardDescription>Усі зареєстровані знахідки</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading || !localized ? (
          <Skeleton className="h-72 w-full" />
        ) : localized.length === 0 ? (
          <p className="py-12 text-center text-sm text-stone-500">
            Немає даних
          </p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={localized}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  stroke="#fff"
                >
                  {localized.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e7e5e4",
                    fontSize: 12,
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
