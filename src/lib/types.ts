export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
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
}
