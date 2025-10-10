"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/data";

const data = [
  { name: "Jan", revenue: 4000, expenses: 2400 },
  { name: "Fév", revenue: 3000, expenses: 1398 },
  { name: "Mar", revenue: 5000, expenses: 3800 },
  { name: "Avr", revenue: 2780, expenses: 1908 },
  { name: "Mai", revenue: 1890, expenses: 1800 },
  { name: "Juin", revenue: 2390, expenses: 1800 },
];

export function OverviewChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCurrency(value as number).replace('F\u202FCFA', 'F CFA')}
        />
        <Tooltip
            contentStyle={{
                background: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "var(--radius)",
            }}
            cursor={{ fill: 'hsl(var(--muted))' }}
            formatter={(value) => formatCurrency(value as number)}
        />
        <Bar
          dataKey="revenue"
          fill="hsl(var(--chart-1))"
          name="Revenus"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="expenses"
          fill="hsl(var(--chart-2))"
          name="Dépenses"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
