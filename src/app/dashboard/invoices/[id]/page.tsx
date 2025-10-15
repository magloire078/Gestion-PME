
"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Invoice, Company } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

function getStatusBadgeVariant(status?: Invoice["status"]) {
  switch (status) {
    case "Payée":
      return "default";
    case "En attente":
      return "secondary";
    case "En retard":
      return "destructive";
    default:
        return "secondary";
  }
}

export default function InvoiceDetailsPage() {
  const { id: invoiceId } = useParams();
  const { user } = useUser();
  const firestore = useFirestore();

  const invoiceRef = useMemoFirebase(() => {
    if (!user || !invoiceId) return null;
    return doc(firestore, `companies/${user.uid}/invoices`, invoiceId as string);
  }, [firestore, user, invoiceId]);

  const companyRef = useMemoFirebase(() => {
    if (!user) return null;
    return doc(firestore, "companies", user.uid);
  }, [firestore, user]);

  const { data: invoice, isLoading: isLoadingInvoice } = useDoc<Invoice>(invoiceRef);
  const { data: company, isLoading: isLoadingCompany } = useDoc<Company>(companyRef);

  const isLoading = isLoadingInvoice || isLoadingCompany;

  const currentStatus = invoice?.status === 'En attente' && new Date(invoice.dueDate) < new Date() ? 'En retard' : invoice?.status;

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/dashboard/invoices">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Retour aux factures</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Détails de la facture</h1>
      </div>
      <Card className="max-w-4xl mx-auto w-full">
        <CardHeader className="p-8">
            {isLoading ? (
                <>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-6 w-32" />
                </>
            ) : (
                <>
                    <CardTitle className="text-3xl">Facture {invoice?.invoiceNumber}</CardTitle>
                    <div className="flex justify-between items-center">
                        <CardDescription>
                            Date d'émission: {invoice ? new Date(invoice.issueDate).toLocaleDateString('fr-FR') : '...'}
                        </CardDescription>
                        <Badge variant={getStatusBadgeVariant(currentStatus)} className={currentStatus === 'Payée' ? 'bg-primary text-primary-foreground' : ''}>
                            {currentStatus}
                        </Badge>
                    </div>
                </>
            )}
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2">
                <h3 className="font-semibold">De:</h3>
                {isLoading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                ) : (
                    <address className="not-italic text-muted-foreground text-sm">
                        <strong>{company?.name}</strong><br />
                        {company?.address}<br />
                        {company?.phone}<br />
                        {company?.contactEmail}
                    </address>
                )}
            </div>
            <div className="space-y-2 text-right">
                <h3 className="font-semibold">Pour:</h3>
                 {isLoading ? (
                    <div className="space-y-2 ml-auto">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-4/5" />
                    </div>
                ) : (
                    <div className="text-muted-foreground text-sm">
                        <p><strong>{invoice?.clientName}</strong></p>
                    </div>
                )}
            </div>
          </div>
          <Separator />
          <div className="space-y-4">
             <div className="grid grid-cols-3 font-semibold">
                <div>Description</div>
                <div className="text-center">Quantité</div>
                <div className="text-right">Montant</div>
             </div>
             <Separator />
             {isLoading ? (
                <div className="grid grid-cols-3">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/4 mx-auto" />
                    <Skeleton className="h-4 w-1/3 ml-auto" />
                </div>
             ) : (
                <div className="grid grid-cols-3">
                    <div>Service de conseil</div>
                    <div className="text-center">1</div>
                    <div className="text-right">{formatCurrency(invoice?.amount ?? 0)}</div>
                </div>
             )}
          </div>
          <Separator />
           <div className="flex justify-end">
                <div className="grid gap-2 w-full max-w-sm text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Sous-total</span>
                        <span>{formatCurrency(invoice?.amount ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">TVA (0%)</span>
                        <span>{formatCurrency(0)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-base">
                        <span>Total</span>
                        <span>{formatCurrency(invoice?.amount ?? 0)}</span>
                    </div>
                </div>
           </div>
        </CardContent>
        <CardFooter className="p-8 flex-col items-start gap-4">
            <div className="space-y-1">
                <h4 className="font-semibold">Termes de paiement</h4>
                <p className="text-xs text-muted-foreground">
                    Paiement dû avant le {invoice ? new Date(invoice.dueDate).toLocaleDateString('fr-FR') : '...'}.
                </p>
            </div>
             {company?.taxId && (
                <p className="text-xs text-muted-foreground">
                    Numéro de TVA: {company.taxId}
                </p>
            )}
        </CardFooter>
      </Card>
    </div>
  );
}
