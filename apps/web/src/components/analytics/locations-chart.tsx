"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocationAnalytics } from "@/hooks/api/use-dashboard-stats";

const truncate = (s: string, n = 22) =>
  s.length > n ? s.slice(0, n - 1) + "…" : s;

export function LocationsChart() {
  const { data, isLoading } = useLocationAnalytics();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Топ-10 локацій</CardTitle>
        <CardDescription>Де найчастіше знаходять речі</CardDescription>
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
              <BarChart
                data={data.map((d) => ({ ...d, label: truncate(d.name) }))}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis type="number" fontSize={11} stroke="#a8a29e" />
                <YAxis
                  type="category"
                  dataKey="label"
                  fontSize={11}
                  stroke="#a8a29e"
                  width={150}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e7e5e4",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="#1c1917" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
