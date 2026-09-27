/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export const description = "An interactive area chart";

const chartConfig = {
  enrollments: {
    label: "Enrollments",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface ChartAreaInteractiveProps {
  // No default sample data: fake 2024 numbers were being shown as real analytics.
  data?: Record<string, any>[];
}

export function ChartAreaInteractive({
  data = [],
  dataKey = "enrollments",
  label = "Enrollments",
  color = "var(--chart-1)"
}: ChartAreaInteractiveProps & { dataKey?: string, label?: string, color?: string }) {
  const totalNumber = React.useMemo(
    () => data.reduce((acc, curr) => acc + (curr[dataKey as keyof typeof curr] as number || 0), 0),
    [data, dataKey]
  );

  const dynamicConfig = {
    [dataKey]: {
      label: label,
      color: color,
    }
  } satisfies ChartConfig;

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Total {label}</CardTitle>
        <CardDescription className="text-gray-700 dark:text-gray-400">
          <span className="hidden @[540px]/card:block">
            Total {label}: {totalNumber.toLocaleString("en-IN")}
          </span>
          <span className="@[540px]/card:hidden">
            Total: {totalNumber.toLocaleString("en-IN")}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {data.length === 0 ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            No data yet
          </div>
        ) : (
        <ChartContainer
          config={dynamicConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={"preserveStartEnd"}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />

            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />
              }
            />

            <Bar dataKey={dataKey} fill={color} />
          </BarChart>
        </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
