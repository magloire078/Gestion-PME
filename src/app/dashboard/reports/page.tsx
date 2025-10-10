"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { handleGenerateReport } from "./actions";
import { Loader2, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/firebase";

export default function ReportsPage() {
  const [report, setReport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  const onGenerate = async () => {
    if (!user) {
        toast({
            variant: "destructive",
            title: "Erreur",
            description: "Vous devez être connecté pour générer un rapport.",
        });
        return;
    }

    setIsLoading(true);
    setReport(null);
    const result = await handleGenerateReport(user.uid);
    setIsLoading(false);

    if (result.success) {
      setReport(result.data);
    } else {
      toast({
        variant: "destructive",
        title: "Erreur de génération",
        description: result.error,
      });
    }
  };

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
          <Button onClick={onGenerate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération en cours...
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
                dangerouslySetInnerHTML={{ __html: report.replace(/\n/g, '<br />') }}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
