
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, PlusCircle, ArrowUpDown } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { Client } from "@/lib/types";

type SortKey = keyof Omit<Client, 'id'>;

function ClientActions({ client, openEditDialog, setSelectedClient, handleDeleteClient }: {
    client: Client;
    openEditDialog: (client: Client) => void;
    setSelectedClient: (client: Client | null) => void;
    handleDeleteClient: () => void;
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
                <DropdownMenuItem onClick={() => openEditDialog(client)}>Modifier</DropdownMenuItem>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSelectedClient(client); }}>Supprimer</DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
                            <AlertDialogDescription>
                            Cette action est irréversible. Le client sera définitivement supprimé.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setSelectedClient(null)}>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteClient()}>Supprimer</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default function ClientsPage() {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({ key: 'name', direction: 'ascending' });
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const clientsCollectionRef = useMemoFirebase(() => {
        if (!user) return null;
        return collection(firestore, `companies/${user.uid}/clients`);
    }, [firestore, user]);

    const { data: clients, isLoading } = useCollection<Omit<Client, 'id'>>(clientsCollectionRef);

    const sortedClients = useMemo(() => {
        let sortableItems = clients ? [...clients] : [];
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
      }, [clients, sortConfig]);

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

    const handleAddClient = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!clientsCollectionRef) return;

        const formData = new FormData(event.currentTarget);
        const newClient = {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            companyId: user!.uid,
        };
        addDocumentNonBlocking(clientsCollectionRef, newClient);
        toast({ title: "Client ajouté", description: "Le nouveau client a été enregistré." });
        setIsAddDialogOpen(false);
        (event.target as HTMLFormElement).reset();
    };

    const handleUpdateClient = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedClient || !user) return;
    
        const formData = new FormData(event.currentTarget);
        const updatedClient = {
          name: formData.get("name") as string,
          email: formData.get("email") as string,
        };
        
        const clientRef = doc(firestore, `companies/${user.uid}/clients`, selectedClient.id);
        updateDocumentNonBlocking(clientRef, updatedClient);
        toast({ title: "Client modifié", description: "Les détails du client ont été mis à jour." });
        setIsEditDialogOpen(false);
        setSelectedClient(null);
    };
    
    const handleDeleteClient = () => {
        if (!selectedClient || !user) return;
        const clientRef = doc(firestore, `companies/${user.uid}/clients`, selectedClient.id);
        deleteDocumentNonBlocking(clientRef);
        toast({ title: "Client supprimé", description: "Le client a été supprimé avec succès." });
        setSelectedClient(null);
    }
    
    const openEditDialog = (client: Client) => {
        setSelectedClient(client);
        setIsEditDialogOpen(true);
    }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Ajouter un client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nouveau client</DialogTitle>
              <DialogDescription>
                Remplissez les détails du nouveau client.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddClient}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Nom</Label>
                  <Input id="name" name="name" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email</Label>
                  <Input id="email" name="email" type="email" className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Ajouter</Button>
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
                <CardContent><div className="space-y-2"><Skeleton className="h-4 w-4/5" /></div></CardContent>
            </Card>
        ))}
        {!isLoading && sortedClients?.map((client) => (
            <Card key={client.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle className="text-base font-bold">{client.name}</CardTitle>
                        <CardDescription>{client.email}</CardDescription>
                    </div>
                </CardHeader>
                 <CardFooter className="flex justify-end border-t pt-4">
                    <ClientActions 
                        client={client}
                        openEditDialog={openEditDialog}
                        setSelectedClient={setSelectedClient}
                        handleDeleteClient={handleDeleteClient}
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
                <Button variant="ghost" onClick={() => requestSort('name')} className="px-0">
                  Nom {getSortIcon('name')}
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => requestSort('email')} className="px-0">
                    Email {getSortIcon('email')}
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
                    <Skeleton className="h-4 w-2/5" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-3/5" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-8 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && sortedClients?.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell className="text-right">
                   <ClientActions 
                        client={client}
                        openEditDialog={openEditDialog}
                        setSelectedClient={setSelectedClient}
                        handleDeleteClient={handleDeleteClient}
                    />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedClient && (
        <Dialog open={isEditDialogOpen} onOpenChange={(isOpen) => {
            if (!isOpen) setSelectedClient(null);
            setIsEditDialogOpen(isOpen);
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Modifier le client</DialogTitle>
              <DialogDescription>
                Mettez à jour les détails du client.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateClient}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editName" className="text-right">Nom</Label>
                  <Input id="editName" name="name" defaultValue={selectedClient.name} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editEmail" className="text-right">Email</Label>
                  <Input id="editEmail" name="email" type="email" defaultValue={selectedClient.email} className="col-span-3" />
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
