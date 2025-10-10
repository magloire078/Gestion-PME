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

export const invoices: Invoice[] = [
  { id: 'INV-001', clientName: 'Alpha Corp', amount: 2500.75, status: 'Payée', issueDate: '2024-05-01', dueDate: '2024-05-31' },
  { id: 'INV-002', clientName: 'Beta Inc', amount: 1500.00, status: 'En attente', issueDate: '2024-05-15', dueDate: '2024-06-15' },
  { id: 'INV-003', clientName: 'Gamma LLC', amount: 350.50, status: 'En retard', issueDate: '2024-04-20', dueDate: '2024-05-20' },
  { id: 'INV-004', clientName: 'Delta Co', amount: 7500.00, status: 'Payée', issueDate: '2024-05-10', dueDate: '2024-06-10' },
  { id: 'INV-005', clientName: 'Epsilon SARL', amount: 500.00, status: 'En attente', issueDate: '2024-05-25', dueDate: '2024-06-25' },
];

export const expenses: Expense[] = [
  { id: 'EXP-001', name: 'Abonnement logiciel de design', category: 'Logiciels', amount: 50.00, date: '2024-05-05' },
  { id: 'EXP-002', name: 'Campagne publicitaire Facebook', category: 'Marketing', amount: 300.00, date: '2024-05-12' },
  { id: 'EXP-003', name: 'Achat de ramettes de papier', category: 'Fournitures de bureau', amount: 75.20, date: '2024-05-18' },
  { id: 'EXP-004', name: 'Billet de train pour rdv client', category: 'Déplacement', amount: 120.00, date: '2024-05-22' },
  { id: 'EXP-005', name: 'Abonnement service cloud', category: 'Logiciels', amount: 25.00, date: '2024-05-28' },
];

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
};
