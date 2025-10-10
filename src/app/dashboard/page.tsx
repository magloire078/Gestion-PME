"use client"

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/data";
import { DollarSign, ArrowUpRight, ArrowDownRight, Scale } from "lucide-react";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";

interface Invoice {
  id: string;
  amount: number;
  status: 'Payée' | 'En attente' | 'En retard';
}

interface Expense {
  id: string;
  amount: number;
}


export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const invoicesCollectionRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `companies/${user.uid}/invoices`);
  }, [firestore, user]);

  const expensesCollectionRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `companies/${user.uid}/expenses`);
  }, [firestore, user]);

  const { data: invoices } = useCollection<Omit<Invoice, 'id'>>(invoicesCollectionRef);
  const { data: expenses } = useCollection<Omit<Expense, 'id'>>(expensesCollectionRef);

  const totalRevenue = useMemo(() => 
    invoices
    ?.filter((invoice) => invoice.status === "Payée")
    .reduce((sum, invoice) => sum + invoice.amount, 0) ?? 0
  , [invoices]);

  const totalExpenses = useMemo(() => 
    expenses?.reduce((sum, expense) => sum + expense.amount, 0) ?? 0
  , [expenses]);

  const netProfit = totalRevenue - totalExpenses;

  const kpiData = [
    {
      title: "Revenu Total",
      amount: formatCurrency(totalRevenue),
      description: "Basé sur les factures payées",
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      changeIcon: <ArrowUpRight className="h-4 w-4 text-accent" />,
    },
    {
      title: "Dépenses Totales",
      amount: formatCurrency(totalExpenses),
      description: "Toutes les dépenses enregistrées",
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      changeIcon: <ArrowDownRight className="h-4 w-4 text-destructive" />,
    },
    {
      title: "Bénéfice Net",
      amount: formatCurrency(netProfit),
      description: "Revenus moins dépenses",
      icon: <Scale className="h-4 w-4 text-muted-foreground" />,
      changeIcon:
        netProfit > 0 ? (
          <ArrowUpRight className="h-4 w-4 text-accent" />
        ) : (
          <ArrowDownRight className="h-4 w-4 text-destructive" />
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Tableau de bord</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpiData.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              {kpi.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.amount}</div>
              <p className="text-xs text-muted-foreground">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Vue d'ensemble</CardTitle>
          <CardDescription>
            Revenus et dépenses des 6 derniers mois.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OverviewChart invoices={invoices ?? []} expenses={expenses ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
