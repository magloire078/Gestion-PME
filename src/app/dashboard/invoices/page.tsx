"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { formatCurrency } from "@/lib/data";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";

// This is a temporary type, we should get this from a better source
interface Invoice {
  id: string;
  clientName: string;
  amount: number;
  status: 'Payée' | 'En attente' | 'En retard';
  issueDate: string;
  dueDate: string;
}

function getStatusBadgeVariant(status: Invoice["status"]) {
  switch (status) {
    case "Payée":
      return "default";
    case "En attente":
      return "secondary";
    case "En retard":
      return "destructive";
  }
}

export default function InvoicesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();

  const invoicesCollectionRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `companies/${user.uid}/invoices`);
  }, [firestore, user]);

  const { data: invoices, isLoading } = useCollection<Omit<Invoice, 'id'>>(invoicesCollectionRef);

  const handleAddInvoice = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!invoicesCollectionRef) return;

    const formData = new FormData(event.currentTarget);
    const newInvoice = {
      invoiceNumber: `INV-${String((invoices?.length || 0) + 1).padStart(3, "0")}`,
      clientName: formData.get("clientName") as string,
      amount: parseFloat(formData.get("amount") as string),
      status: "En attente",
      issueDate: new Date().toISOString(),
      dueDate: new Date(formData.get("dueDate") as string).toISOString(),
      companyId: user!.uid,
    };
    addDocumentNonBlocking(invoicesCollectionRef, newInvoice);
    setIsDialogOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Factures</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Créer une facture
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nouvelle facture</DialogTitle>
              <DialogDescription>
                Remplissez les détails de la nouvelle facture.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddInvoice}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="clientName" className="text-right">
                    Client
                  </Label>
                  <Input id="clientName" name="clientName" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    Montant
                  </Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="dueDate" className="text-right">
                    Échéance
                  </Label>
                  <Input id="dueDate" name="dueDate" type="date" className="col-span-3" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Créer</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center">Chargement...</TableCell>
              </TableRow>
            )}
            {!isLoading && invoices?.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.clientName}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(invoice.status)} className={invoice.status === 'Payée' ? 'bg-accent text-accent-foreground' : ''}>
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(invoice.amount)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>Modifier</DropdownMenuItem>
                      <DropdownMenuItem>Supprimer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
