"use client";

import { useState, useMemo } from "react";
import Link from 'next/link';
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
import { MoreHorizontal, PlusCircle, ArrowUpDown, ExternalLink, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useUser, useFirestore, useStorage, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { Expense } from "@/lib/types";

type SortKey = keyof Omit<Expense, 'id' | 'companyId'>;

const expenseCategories: Expense["category"][] = [
  "Marketing",
  "Logiciels",
  "Fournitures de bureau",
  "Déplacement",
  "Autre",
];


function ExpenseActions({ expense, openEditDialog, setSelectedExpense, handleDeleteExpense }: {
    expense: Expense;
    openEditDialog: (expense: Expense) => void;
    setSelectedExpense: (expense: Expense | null) => void;
    handleDeleteExpense: () => void;
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
                <DropdownMenuItem onClick={() => openEditDialog(expense)}>Modifier</DropdownMenuItem>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSelectedExpense(expense); }}>Supprimer</DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
                            <AlertDialogDescription>
                            Cette action est irréversible. La dépense sera définitivement supprimée.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setSelectedExpense(null)}>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteExpense()}>Supprimer</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default function ExpensesPage() {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({ key: 'date', direction: 'descending' });
    const [isUploading, setIsUploading] = useState(false);
    const { user } = useUser();
    const firestore = useFirestore();
    const storage = useStorage();
    const { toast } = useToast();

    const expensesCollectionRef = useMemoFirebase(() => {
        if (!user) return null;
        return collection(firestore, `companies/${user.uid}/expenses`);
    }, [firestore, user]);

    const { data: expenses, isLoading } = useCollection<Omit<Expense, 'id'>>(expensesCollectionRef);

    const sortedExpenses = useMemo(() => {
        let sortableItems = expenses ? [...expenses] : [];
        if (sortConfig.key) {
          sortableItems.sort((a, b) => {
            const aValue = a[sortConfig.key] || '';
            const bValue = b[sortConfig.key] || '';
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
      }, [expenses, sortConfig]);

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
    
    const uploadReceipt = async (file: File): Promise<string | null> => {
        if (!user) return null;
        setIsUploading(true);
        const storageRef = ref(storage, `receipts/${user.uid}/${Date.now()}_${file.name}`);
        try {
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            return downloadURL;
        } catch (error) {
            console.error("Error uploading receipt:", error);
            toast({ variant: "destructive", title: "Erreur de téléversement", description: "Impossible de téléverser le justificatif." });
            return null;
        } finally {
            setIsUploading(false);
        }
    };


    const handleAddExpense = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!expensesCollectionRef || !user) return;

        const formData = new FormData(event.currentTarget);
        const receiptFile = formData.get("receipt") as File | null;
        let receiptUrl: string | undefined = undefined;

        if (receiptFile && receiptFile.size > 0) {
            const uploadedUrl = await uploadReceipt(receiptFile);
            if (!uploadedUrl) return; // Stop if upload fails
            receiptUrl = uploadedUrl;
        }

        const newExpense = {
            description: formData.get("description") as string,
            category: formData.get("category") as Expense['category'],
            amount: parseFloat(formData.get("amount") as string),
            date: new Date(formData.get("date") as string).toISOString(),
            companyId: user.uid,
            ...(receiptUrl && { receiptUrl }),
        };
        addDocumentNonBlocking(expensesCollectionRef, newExpense);
        toast({ title: "Dépense ajoutée", description: "La nouvelle dépense a été enregistrée." });
        setIsAddDialogOpen(false);
        (event.target as HTMLFormElement).reset();
    };

    const handleUpdateExpense = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedExpense || !user) return;
    
        const formData = new FormData(event.currentTarget);
        const receiptFile = formData.get("receipt") as File | null;
        let receiptUrl = selectedExpense.receiptUrl;

        if (receiptFile && receiptFile.size > 0) {
            const uploadedUrl = await uploadReceipt(receiptFile);
            if (!uploadedUrl) return; // Stop if upload fails
            receiptUrl = uploadedUrl;
        }

        const updatedExpense = {
          description: formData.get("description") as string,
          category: formData.get("category") as Expense['category'],
          amount: parseFloat(formData.get("amount") as string),
          date: new Date(formData.get("date") as string).toISOString(),
          ...(receiptUrl && { receiptUrl }),
        };
        
        const expenseRef = doc(firestore, `companies/${user.uid}/expenses`, selectedExpense.id);
        updateDocumentNonBlocking(expenseRef, updatedExpense);
        toast({ title: "Dépense modifiée", description: "Les détails de la dépense ont été mis à jour." });
        setIsEditDialogOpen(false);
        setSelectedExpense(null);
    };
    
    const handleDeleteExpense = () => {
        if (!selectedExpense || !user) return;
        const expenseRef = doc(firestore, `companies/${user.uid}/expenses`, selectedExpense.id);
        deleteDocumentNonBlocking(expenseRef);
        toast({ title: "Dépense supprimée", description: "La dépense a été supprimée avec succès." });
        setSelectedExpense(null);
    }
    
    const openEditDialog = (expense: Expense) => {
        setSelectedExpense(expense);
        setIsEditDialogOpen(true);
    }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dépenses</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter une dépense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nouvelle dépense</DialogTitle>
              <DialogDescription>
                Remplissez les détails de la nouvelle dépense.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddExpense}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">Description</Label>
                  <Input id="description" name="description" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">Catégorie</Label>
                  <Select name="category" required>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionnez..." />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">Montant</Label>
                  <Input id="amount" name="amount" type="number" step="0.01" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">Date</Label>
                  <Input id="date" name="date" type="date" className="col-span-3" defaultValue={new Date().toISOString().substring(0, 10)} required />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="receipt" className="text-right">Justificatif</Label>
                  <Input id="receipt" name="receipt" type="file" className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isUploading}>
                    {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Ajouter
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

       {/* Mobile View */}
      <div className="grid gap-4 md:hidden">
        {isLoading && [...Array(3)].map((_, i) => (
            <Card key={i}>
                <CardHeader><Skeleton className="h-6 w-3/5" /></CardHeader>
                <CardContent><div className="space-y-2"><Skeleton className="h-4 w-4/5" /><Skeleton className="h-4 w-3/5" /></div></CardContent>
            </Card>
        ))}
        {!isLoading && sortedExpenses?.map((expense) => (
            <Card key={expense.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle className="text-base font-bold">{expense.description}</CardTitle>
                        <CardDescription>{expense.category}</CardDescription>
                    </div>
                    <div className="text-right font-bold text-lg">{formatCurrency(expense.amount)}</div>
                </CardHeader>
                <CardContent>
                     <p className="text-xs text-muted-foreground">Date: {new Date(expense.date).toLocaleDateString('fr-FR')}</p>
                     {expense.receiptUrl && (
                        <Link href={expense.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-2">
                            Voir justificatif <ExternalLink className="h-3 w-3" />
                        </Link>
                     )}
                </CardContent>
                 <CardFooter className="flex justify-end border-t pt-4">
                    <ExpenseActions 
                        expense={expense}
                        openEditDialog={openEditDialog}
                        setSelectedExpense={setSelectedExpense}
                        handleDeleteExpense={handleDeleteExpense}
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
                <Button variant="ghost" onClick={() => requestSort('description')} className="px-0">
                  Description {getSortIcon('description')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('category')} className="px-0">
                    Catégorie {getSortIcon('category')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('date')} className="px-0">
                    Date {getSortIcon('date')}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" onClick={() => requestSort('amount')} className="px-0">
                    Montant {getSortIcon('amount')}
                </Button>
              </TableHead>
              <TableHead>Justificatif</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-3/5" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-2/5" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-20 ml-auto" />
                  </TableCell>
                   <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-8 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && sortedExpenses?.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">{expense.description}</TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell>{new Date(expense.date).toLocaleDateString('fr-FR')}</TableCell>
                <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                <TableCell>
                  {expense.receiptUrl && (
                    <Button asChild variant="ghost" size="icon">
                      <Link href={expense.receiptUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        <span className="sr-only">Voir justificatif</span>
                      </Link>
                    </Button>
                  )}
                </TableCell>
                <TableCell className="text-right">
                   <ExpenseActions 
                        expense={expense}
                        openEditDialog={openEditDialog}
                        setSelectedExpense={setSelectedExpense}
                        handleDeleteExpense={handleDeleteExpense}
                    />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedExpense && (
        <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
            if (!isOpen) setSelectedExpense(null);
            setIsEditDialogOpen(isOpen);
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Modifier la dépense</DialogTitle>
              <DialogDescription>
                Mettez à jour les détails de la dépense.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateExpense}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editDescription" className="text-right">Description</Label>
                  <Input id="editDescription" name="description" defaultValue={selectedExpense.description} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editCategory" className="text-right">Catégorie</Label>
                  <Select name="category" defaultValue={selectedExpense.category} required>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editAmount" className="text-right">Montant</Label>
                  <Input id="editAmount" name="amount" type="number" step="0.01" defaultValue={selectedExpense.amount} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editDate" className="text-right">Date</Label>
                  <Input id="editDate" name="date" type="date" defaultValue={selectedExpense.date.substring(0, 10)} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editReceipt" className="text-right">Justificatif</Label>
                  <Input id="editReceipt" name="receipt" type="file" className="col-span-3" />
                </div>
                 {selectedExpense.receiptUrl && (
                    <div className="col-span-4 text-center text-sm">
                        <Link href={selectedExpense.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center justify-center gap-1">
                            Voir le justificatif actuel <ExternalLink className="h-3 w-3" />
                        </Link>
                        <p className="text-muted-foreground text-xs">Téléverser un nouveau fichier le remplacera.</p>
                    </div>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isUploading}>
                    {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enregistrer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
