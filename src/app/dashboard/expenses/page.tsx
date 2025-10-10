"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { formatCurrency } from "@/lib/data";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

// This is a temporary type, we should get this from a better source
interface Expense {
    id: string;
    description: string;
    category: 'Marketing' | 'Logiciels' | 'Fournitures de bureau' | 'Déplacement' | 'Autre';
    amount: number;
    date: string;
  };

const expenseCategories: Expense["category"][] = [
  "Marketing",
  "Logiciels",
  "Fournitures de bureau",
  "Déplacement",
  "Autre",
];

export default function ExpensesPage() {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const expensesCollectionRef = useMemoFirebase(() => {
        if (!user) return null;
        return collection(firestore, `companies/${user.uid}/expenses`);
    }, [firestore, user]);

    const { data: expenses, isLoading } = useCollection<Omit<Expense, 'id'>>(expensesCollectionRef);


    const handleAddExpense = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!expensesCollectionRef) return;

        const formData = new FormData(event.currentTarget);
        const newExpense = {
        description: formData.get("description") as string,
        category: formData.get("category") as Expense['category'],
        amount: parseFloat(formData.get("amount") as string),
        date: new Date(formData.get("date") as string).toISOString(),
        companyId: user!.uid,
        };
        addDocumentNonBlocking(expensesCollectionRef, newExpense);
        toast({ title: "Dépense ajoutée", description: "La nouvelle dépense a été enregistrée." });
        setIsAddDialogOpen(false);
        (event.target as HTMLFormElement).reset();
    };

    const handleUpdateExpense = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedExpense || !user) return;
    
        const formData = new FormData(event.currentTarget);
        const updatedExpense = {
          description: formData.get("description") as string,
          category: formData.get("category") as Expense['category'],
          amount: parseFloat(formData.get("amount") as string),
          date: new Date(formData.get("date") as string).toISOString(),
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
              </div>
              <DialogFooter>
                <Button type="submit">Ajouter</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center">Chargement...</TableCell>
                </TableRow>
            )}
            {!isLoading && expenses?.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">{expense.description}</TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell>{new Date(expense.date).toLocaleDateString('fr-FR')}</TableCell>
                <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
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
