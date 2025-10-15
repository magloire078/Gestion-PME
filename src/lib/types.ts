export interface Client {
  id: string;
  name: string;
  email?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string; // Denormalized for easier display
  amount: number;
  status: 'Payée' | 'En attente' | 'En retard';
  issueDate: string;
  dueDate: string;
}

export interface Expense {
  id: string;
  description: string;
  category: 'Marketing' | 'Logiciels' | 'Fournitures de bureau' | 'Déplacement' | 'Autre';
  amount: number;
  date: string;
  receiptUrl?: string;
}

export interface Company {
    id: string;
    name: string;
    creationDate: string;
    address?: string;
    phone?: string;
    contactEmail?: string;
    taxId?: string;
}
