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

// This dummy data is kept for backward compatibility and fallback scenarios
const dummyEnrollmentData = [
  { date: "2024-05-15", enrollments: 12 },
  { date: "2024-05-16", enrollments: 8 },
  { date: "2024-05-17", enrollments: 15 },
  { date: "2024-05-18", enrollments: 23 },
  { date: "2024-05-19", enrollments: 18 },
  { date: "2024-05-20", enrollments: 31 },
  { date: "2024-05-21", enrollments: 28 },
  { date: "2024-05-22", enrollments: 22 },
  { date: "2024-05-23", enrollments: 19 },
  { date: "2024-05-24", enrollments: 35 },
  { date: "2024-05-25", enrollments: 42 },
  { date: "2024-05-26", enrollments: 38 },
  { date: "2024-05-27", enrollments: 29 },
  { date: "2024-05-28", enrollments: 33 },
  { date: "2024-05-29", enrollments: 45 },
  { date: "2024-05-30", enrollments: 52 },
  { date: "2024-05-31", enrollments: 48 },
  { date: "2024-06-01", enrollments: 55 },
  { date: "2024-06-02", enrollments: 41 },
  { date: "2024-06-03", enrollments: 37 },
  { date: "2024-06-04", enrollments: 44 },
  { date: "2024-06-05", enrollments: 39 },
  { date: "2024-06-06", enrollments: 47 },
  { date: "2024-06-07", enrollments: 51 },
  { date: "2024-06-08", enrollments: 43 },
  { date: "2024-06-09", enrollments: 36 },
  { date: "2024-06-10", enrollments: 49 },
  { date: "2024-06-11", enrollments: 58 },
  { date: "2024-06-12", enrollments: 62 },
  { date: "2024-06-13", enrollments: 54 },
  { date: "2024-06-14", enrollments: 46 },
  { date: "2024-06-15", enrollments: 40 },
];
const chartConfig = {
  enrollments: {
    label: "Enrollments",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface ChartAreaInteractiveProps {
  data?: Record<string, any>[];
}

export function ChartAreaInteractive({
  data = dummyEnrollmentData,
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
            Total {label}: {totalNumber.toLocaleString()}
          </span>
          <span className="@[540px]/card:hidden">
            Total: {totalNumber.toLocaleString()}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
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
                return date.toLocaleDateString("en-US", {
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
                    return date.toLocaleDateString("en-US", {
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
      </CardContent>
    </Card>
  );
}
