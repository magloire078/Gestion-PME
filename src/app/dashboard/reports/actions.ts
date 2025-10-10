"use server";

import { generateFinancialReport } from "@/ai/flows/generate-financial-reports";
import { getDocs, collection } from "firebase/firestore";
import { getSdks } from '@/firebase';
import { getApp, getApps } from "firebase/app";

// Temporary helper until we have a better way to get the admin SDK
function getFirestoreAdmin() {
    const app = getApps().length ? getApp() : undefined;
    if (!app) {
        throw new Error("Firebase app not initialized");
    }
    return getSdks(app).firestore;
}

export async function handleGenerateReport(userId: string) {
  try {
    const firestore = getFirestoreAdmin();
    const invoicesRef = collection(firestore, `companies/${userId}/invoices`);
    const expensesRef = collection(firestore, `companies/${userId}/expenses`);

    const [invoicesSnapshot, expensesSnapshot] = await Promise.all([
        getDocs(invoicesRef),
        getDocs(expensesRef)
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
