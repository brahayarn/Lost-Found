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

const COLORS = [
  "#1c1917",
  "#44403c",
  "#78716c",
  "#a8a29e",
  "#d6d3d1",
  "#57534e",
  "#292524",
];

export function CategoryPieChart() {
  const { data, isLoading } = useCategoryAnalytics();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Розподіл за категоріями</CardTitle>
        <CardDescription>Усі зареєстровані знахідки</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading || !data ? (
          <Skeleton className="h-72 w-full" />
        ) : data.length === 0 ? (
          <p className="py-12 text-center text-sm text-stone-500">
            Немає даних
          </p>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  stroke="#fff"
                >
                  {data.map((_, i) => (
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
