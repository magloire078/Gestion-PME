"use client";

import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/data";
import { eachMonthOfInterval, subMonths, format, startOfMonth } from "date-fns";
import { fr } from 'date-fns/locale';
import type { Invoice, Expense } from "@/lib/types";

interface OverviewChartProps {
    invoices: (Omit<Invoice, 'id'>)[];
    expenses: (Omit<Expense, 'id'>)[];
}

export function OverviewChart({ invoices, expenses }: OverviewChartProps) {
  const data = useMemo(() => {
    const sixMonthsAgo = subMonths(new Date(), 5);
    const months = eachMonthOfInterval({
      start: sixMonthsAgo,
      end: new Date(),
    });

    const monthlyData = months.map(month => ({
      name: format(month, 'MMM', { locale: fr }),
      revenue: 0,
      expenses: 0,
    }));

    invoices.forEach(invoice => {
        if (invoice.status === 'Payée') {
            const monthIndex = months.findIndex(m => startOfMonth(m).getTime() === startOfMonth(new Date(invoice.issueDate)).getTime());
            if (monthIndex !== -1) {
                monthlyData[monthIndex].revenue += invoice.amount;
            }
        }
    });

    expenses.forEach(expense => {
        const monthIndex = months.findIndex(m => startOfMonth(m).getTime() === startOfMonth(new Date(expense.date)).getTime());
        if (monthIndex !== -1) {
            monthlyData[monthIndex].expenses += expense.amount;
        }
    });

    return monthlyData;
  }, [invoices, expenses]);


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
