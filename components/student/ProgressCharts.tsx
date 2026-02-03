"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

/**
 * Progress Charts Component
 * Author: Sanket
 */

interface ProgressChartsProps {
    data: any[];
}

export function ProgressCharts({ data }: ProgressChartsProps) {
    // Process data for Recharts
    // Group by date and sum durations
    const groupedData = data.reduce((acc: any, session: any) => {
        const date = new Date(session.scheduledAt).toLocaleDateString();
        if (!acc[date]) {
            acc[date] = { date, hours: 0 };
        }
        acc[date].hours += session.duration / 60;
        return acc;
    }, {});

    const chartData = Object.values(groupedData).slice(-30);

    if (chartData.length === 0) {
        return (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm italic">
                No session activity found in the last 30 days.
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                    dataKey="date" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                />
                <YAxis 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `${value}h`}
                />
                <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#2563eb' }}
                    activeDot={{ r: 6 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
