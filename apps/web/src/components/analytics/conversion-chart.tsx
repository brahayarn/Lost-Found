"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDailyAnalytics } from "@/hooks/api/use-dashboard-stats";

const formatTick = (iso: string) =>
  new Date(iso).toLocaleDateString("uk-UA", { day: "2-digit", month: "short" });

export function ConversionChart() {
  const { data, isLoading } = useDailyAnalytics();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Знайдено vs повернуто</CardTitle>
        <CardDescription>Динаміка за 7 днів</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading || !data ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="found" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1c1917" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#1c1917" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="returned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#78716c" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#78716c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatTick}
                  fontSize={11}
                  stroke="#a8a29e"
                />
                <YAxis fontSize={11} stroke="#a8a29e" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e7e5e4",
                    fontSize: 12,
                  }}
                  labelFormatter={formatTick}
                />
                <Area
                  type="monotone"
                  dataKey="found"
                  stroke="#1c1917"
                  strokeWidth={2}
                  fill="url(#found)"
                  name="Знайдено"
                />
                <Area
                  type="monotone"
                  dataKey="returned"
                  stroke="#78716c"
                  strokeWidth={2}
                  fill="url(#returned)"
                  name="Повернуто"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
