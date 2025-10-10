"use server";

import { generateFinancialReport } from "@/ai/flows/generate-financial-reports";
import { invoices, expenses } from "@/lib/data";

export async function handleGenerateReport() {
  try {
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
