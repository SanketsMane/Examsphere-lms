"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const config = {
  revenue: { label: "Revenue (₹)", color: "var(--chart-1, hsl(24 95% 53%))" },
} satisfies ChartConfig;

export function SalesChart({ data }: { data: { date: string; revenue: number; sales: number }[] }) {
  const empty = data.every((d) => d.revenue === 0);
  if (empty) {
    return <p className="py-16 text-center text-sm text-muted-foreground">No paid sales in this period yet.</p>;
  }
  return (
    <ChartContainer config={config} className="h-64 w-full">
      <BarChart data={data} margin={{ left: 4, right: 4 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          minTickGap={24}
          tickFormatter={(d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        />
        <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(d) => new Date(String(d)).toLocaleDateString("en-IN", { dateStyle: "medium" })}
            />
          }
        />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
