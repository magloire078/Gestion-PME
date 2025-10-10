// This file contains placeholder data.
// In a real application, you would fetch this data from a database.

export type Invoice = {
    id: string;
    clientName: string;
    amount: number;
    status: 'Payée' | 'En attente' | 'En retard';
    issueDate: string;
    dueDate: string;
  };
  
  export type Expense = {
    id: string;
    name: string;
    category: 'Marketing' | 'Logiciels' | 'Fournitures de bureau' | 'Déplacement' | 'Autre';
    amount: number;
    date: string;
  };

  export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount);
  };
  