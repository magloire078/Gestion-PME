"use server";

import { generateFinancialReport } from "@/ai/flows/generate-financial-reports";
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, App } from 'firebase-admin/app';

// Initialize Firebase Admin SDK
function getAdminApp(): App {
    if (getApps().length) {
        return getApps()[0]!;
    }
    return initializeApp();
}

export async function handleGenerateReport(userId: string) {
  try {
    const app = getAdminApp();
    const firestore = getFirestore(app);
    
    const invoicesRef = firestore.collection(`companies/${userId}/invoices`);
    const expensesRef = firestore.collection(`companies/${userId}/expenses`);

    const [invoicesSnapshot, expensesSnapshot] = await Promise.all([
        invoicesRef.get(),
        expensesRef.get()
    ]);

    const invoices = invoicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (invoices.length === 0 && expenses.length === 0) {
        return { success: true, data: "Aucune donnée de facture ou de dépense n'a été trouvée. Veuillez d'abord ajouter des données pour générer un rapport." };
    }

    const report = await generateFinancialReport({
      invoices: JSON.stringify(invoices),
      expenses: JSON.stringify(expenses),
    });
    return { success: true, data: report.report };
  } catch (error) {
    console.error("Error generating report:", error);
    return { success: false, error: "Failed to generate report." };
  }
}
