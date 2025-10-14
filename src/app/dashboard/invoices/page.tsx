
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, PlusCircle, ArrowUpDown } from "lucide-react";
import { formatCurrency } from "@/lib/data";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { Invoice, Client } from "@/lib/types";

type SortKey = keyof Omit<Invoice, 'id' | 'companyId' | 'clientId'>;

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

function InvoiceActions({ invoice, openEditDialog, setSelectedInvoice, handleMarkAsPaid, handleDeleteInvoice }: {
    invoice: Invoice;
    openEditDialog: (invoice: Invoice) => void;
    setSelectedInvoice: (invoice: Invoice | null) => void;
    handleMarkAsPaid: (invoiceId: string) => void;
    handleDeleteInvoice: () => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button aria-haspopup="true" size="icon" variant="ghost">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {invoice.status !== 'Payée' && (
                    <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice.id)}>
                        Marquer comme payée
                    </DropdownMenuItem>
                )}
                {invoice.status !== 'Payée' && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={() => openEditDialog(invoice)}>Modifier</DropdownMenuItem>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSelectedInvoice(invoice); }}>Supprimer</DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Cette action est irréversible. La facture sera définitivement supprimée.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setSelectedInvoice(null)}>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteInvoice()}>Supprimer</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default function InvoicesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({ key: 'issueDate', direction: 'descending' });
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const invoicesCollectionRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `companies/${user.uid}/invoices`);
  }, [firestore, user]);

  const clientsCollectionRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `companies/${user.uid}/clients`);
  }, [firestore, user]);

  const { data: invoices, isLoading: isLoadingInvoices } = useCollection<Omit<Invoice, 'id'>>(invoicesCollectionRef);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Omit<Client, 'id'>>(clientsCollectionRef);
  
  const sortedInvoices = useMemo(() => {
    let sortableItems = invoices ? [...invoices] : [];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [invoices, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortConfig.direction === 'ascending' ? <ArrowUpDown className="ml-2 h-4 w-4" /> : <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  const handleAddInvoice = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!invoicesCollectionRef || !clients) return;

    const formData = new FormData(event.currentTarget);
    const clientId = formData.get("clientId") as string;
    const client = clients.find(c => c.id === clientId);

    if (!client) {
        toast({ variant: "destructive", title: "Client non trouvé" });
        return;
    }

    const newInvoice = {
      invoiceNumber: `INV-2024-${String((invoices?.length || 0) + 1).padStart(3, "0")}`,
      clientId: client.id,
      clientName: client.name, // Denormalized name
      amount: parseFloat(formData.get("amount") as string),
      status: "En attente" as const,
      issueDate: new Date().toISOString(),
      dueDate: new Date(formData.get("dueDate") as string).toISOString(),
      companyId: user!.uid,
    };
    addDocumentNonBlocking(invoicesCollectionRef, newInvoice);
    toast({ title: "Facture créée", description: `La facture pour ${newInvoice.clientName} a été ajoutée.` });
    setIsAddDialogOpen(false);
    (event.target as HTMLFormElement).reset();
  };

  const handleUpdateInvoice = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedInvoice || !user || !clients) return;

    const formData = new FormData(event.currentTarget);
    const clientId = formData.get("clientId") as string;
    const client = clients.find(c => c.id === clientId);
    if (!client) {
        toast({ variant: "destructive", title: "Client non trouvé" });
        return;
    }
    
    const updatedInvoice = {
      clientId: client.id,
      clientName: client.name,
      amount: parseFloat(formData.get("amount") as string),
      dueDate: new Date(formData.get("dueDate") as string).toISOString(),
    };
    
    const invoiceRef = doc(firestore, `companies/${user.uid}/invoices`, selectedInvoice.id);
    updateDocumentNonBlocking(invoiceRef, updatedInvoice);
    toast({ title: "Facture modifiée", description: "Les détails de la facture ont été mis à jour." });
    setIsEditDialogOpen(false);
    setSelectedInvoice(null);
  };

  const handleDeleteInvoice = () => {
    if (!selectedInvoice || !user) return;
    const invoiceRef = doc(firestore, `companies/${user.uid}/invoices`, selectedInvoice.id);
    deleteDocumentNonBlocking(invoiceRef);
    toast({ title: "Facture supprimée", description: "La facture a été supprimée avec succès." });
    setSelectedInvoice(null);
  }

  const handleMarkAsPaid = (invoiceId: string) => {
    if (!user) return;
    const invoiceRef = doc(firestore, `companies/${user.uid}/invoices`, invoiceId);
    updateDocumentNonBlocking(invoiceRef, { status: "Payée" });
    toast({ title: "Statut mis à jour", description: "La facture a été marquée comme payée." });
  };

  const openEditDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsEditDialogOpen(true);
  }

  const isLoading = isLoadingInvoices || isLoadingClients;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Factures</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={isLoadingClients || !clients || clients.length === 0}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Créer une facture
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nouvelle facture</DialogTitle>
              <DialogDescription>
                {(!clients || clients.length === 0) 
                    ? "Veuillez d'abord ajouter un client dans l'onglet 'Clients'."
                    : "Remplissez les détails de la nouvelle facture."
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddInvoice}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="clientId" className="text-right">
                    Client
                  </Label>
                  <Select name="clientId" required>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionnez un client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

      {/* Mobile View */}
      <div className="grid gap-4 md:hidden">
        {isLoading && [...Array(3)].map((_, i) => (
            <Card key={i}><CardHeader><Skeleton className="h-6 w-3/5" /></CardHeader><CardContent><div className="space-y-2"><Skeleton className="h-4 w-4/5" /><Skeleton className="h-4 w-3/5" /></div></CardContent></Card>
        ))}
        {!isLoading && sortedInvoices?.map((invoice) => (
            <Card key={invoice.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle className="text-base font-bold">{invoice.invoiceNumber}</CardTitle>
                        <CardDescription>{invoice.clientName}</CardDescription>
                    </div>
                    <div className="text-right font-bold text-lg">{formatCurrency(invoice.amount)}</div>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                    <Badge variant={getStatusBadgeVariant(invoice.status)} className={invoice.status === 'Payée' ? 'bg-primary text-primary-foreground' : ''}>
                        {invoice.status}
                    </Badge>
                     <p className="text-xs text-muted-foreground">Échéance: {new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</p>
                </CardContent>
                 <CardFooter className="flex justify-end border-t pt-4">
                    <InvoiceActions 
                        invoice={invoice} 
                        openEditDialog={openEditDialog} 
                        setSelectedInvoice={setSelectedInvoice}
                        handleMarkAsPaid={handleMarkAsPaid}
                        handleDeleteInvoice={handleDeleteInvoice}
                    />
                </CardFooter>
            </Card>
        ))}
      </div>


      {/* Desktop View */}
      <div className="hidden md:block border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
                <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('invoiceNumber')} className="px-0">
                        Numéro {getSortIcon('invoiceNumber')}
                    </Button>
                </TableHead>
                <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('clientName')} className="px-0">
                        Client {getSortIcon('clientName')}
                    </Button>
                </TableHead>
                <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('status')} className="px-0">
                        Statut {getSortIcon('status')}
                    </Button>
                </TableHead>
                <TableHead className="text-right">
                    <Button variant="ghost" onClick={() => requestSort('amount')} className="px-0">
                        Montant {getSortIcon('amount')}
                    </Button>
                </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-24 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-8 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && sortedInvoices?.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                <TableCell>{invoice.clientName}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(invoice.status)} className={invoice.status === 'Payée' ? 'bg-primary text-primary-foreground' : ''}>
                    {invoice.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(invoice.amount)}
                </TableCell>
                <TableCell className="text-right">
                  <InvoiceActions 
                    invoice={invoice} 
                    openEditDialog={openEditDialog} 
                    setSelectedInvoice={setSelectedInvoice}
                    handleMarkAsPaid={handleMarkAsPaid}
                    handleDeleteInvoice={handleDeleteInvoice}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {selectedInvoice && (
        <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
            if (!isOpen) setSelectedInvoice(null);
            setIsEditDialogOpen(isOpen);
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Modifier la facture</DialogTitle>
              <DialogDescription>
                Mettez à jour les détails de la facture.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateInvoice}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editClientId" className="text-right">Client</Label>
                  <Select name="clientId" defaultValue={selectedInvoice.clientId} required>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {clients?.map(client => (
                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editAmount" className="text-right">Montant</Label>
                  <Input id="editAmount" name="amount" type="number" step="0.01" defaultValue={selectedInvoice.amount} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editDueDate" className="text-right">Échéance</Label>
                  <Input id="editDueDate" name="dueDate" type="date" defaultValue={selectedInvoice.dueDate.substring(0, 10)} className="col-span-3" required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Enregistrer</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
