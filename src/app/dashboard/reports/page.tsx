"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateFinancialReport } from "@/ai/flows/generate-financial-reports";
import { Loader2, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Invoice, Expense } from "@/lib/types";

export default function ReportsPage() {
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  const invoicesCollectionRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `companies/${user.uid}/invoices`);
  }, [firestore, user]);

  const expensesCollectionRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, `companies/${user.uid}/expenses`);
  }, [firestore, user]);

  const { data: invoices, isLoading: isLoadingInvoices } = useCollection<Omit<Invoice, 'id'>>(invoicesCollectionRef);
  const { data: expenses, isLoading: isLoadingExpenses } = useCollection<Omit<Expense, 'id'>>(expensesCollectionRef);

  const onGenerate = async () => {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Vous devez être connecté pour générer un rapport.",
        });
        return;
    }

    if (!invoices || !expenses) {
        toast({
            title: "Données en cours de chargement",
            description: "Veuillez patienter pendant que nous chargeons vos données financières.",
        });
        return;
    }

    setIsLoading(true);
    setReport(null);

    try {
        if (invoices.length === 0 && expenses.length === 0) {
            setReport("Aucune donnée de facture ou de dépense n'a été trouvée. Veuillez d'abord ajouter des données pour générer un rapport.");
            setIsLoading(false);
            return;
        }

        const result = await generateFinancialReport({
            invoices: JSON.stringify(invoices),
            expenses: JSON.stringify(expenses),
        });
        setReport(result.report);
    } catch (error) {
        console.error("Error generating report:", error);
        toast({
            variant: "destructive",
            title: "Erreur de génération",
            description: "Impossible de générer le rapport. Veuillez réessayer.",
        });
    } finally {
        setIsLoading(false);
    }
  };

  const isDataLoading = isLoadingInvoices || isLoadingExpenses;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Rapports Financiers</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Analyse Financière par IA</CardTitle>
          <CardDescription>
            Générez un rapport financier détaillé basé sur vos factures et dépenses actuelles. L'IA analysera vos données pour fournir des informations sur la rentabilité, les tendances et des recommandations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onGenerate} disabled={isLoading || isDataLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération en cours...
              </>
            ) : isDataLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Chargement des données...
                </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Générer le rapport
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {(isLoading || report) && (
        <Card>
          <CardHeader>
            <CardTitle>Rapport Généré</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-5/6 animate-pulse mt-6"></div>
                <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
              </div>
            )}
            {report && (
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: report }}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
