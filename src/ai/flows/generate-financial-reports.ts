'use server';

/**
 * @fileOverview Flow for generating financial reports based on a tracked invoices and expenses.
 *
 * - generateFinancialReport - A function to generate financial reports.
 * - GenerateFinancialReportInput - The input type for the generateFinancialReport function.
 * - GenerateFinancialReportOutput - The return type for the generateFinancialReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFinancialReportInputSchema = z.object({
  invoices: z.string().describe('A JSON string of all invoices.'),
  expenses: z.string().describe('A JSON string of all expenses.'),
});
export type GenerateFinancialReportInput = z.infer<typeof GenerateFinancialReportInputSchema>;

const GenerateFinancialReportOutputSchema = z.object({
  report: z.string().describe('A detailed financial report summarizing profitability and expenses, formatted as an HTML string.'),
});
export type GenerateFinancialReportOutput = z.infer<typeof GenerateFinancialReportOutputSchema>;

export async function generateFinancialReport(input: GenerateFinancialReportInput): Promise<GenerateFinancialReportOutput> {
  return generateFinancialReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFinancialReportPrompt',
  input: {schema: GenerateFinancialReportInputSchema},
  output: {schema: GenerateFinancialReportOutputSchema},
  prompt: `You are an expert financial analyst. Generate a financial report based on the provided invoices and expenses.

Invoices: {{{invoices}}}
Expenses: {{{expenses}}}

Analyze the data and provide a comprehensive report formatted as an HTML string. The report must include:
- A main title (e.g., <h2>Rapport Financier</h2>).
- Sections for "Résumé", "Analyse des Revenus", "Analyse des Dépenses", and "Recommandations" using <h3> for subtitles.
- Key metrics (Total Income, Total Expenses, Net Profit/Loss) presented clearly, perhaps in a list (<ul>) or with bold tags (<strong>).
- Key observations, trends, and actionable recommendations for improving profitability and reducing expenses, presented as bullet points in unordered lists (<ul><li>...</li></ul>).

Ensure the entire output is a single, valid HTML string, ready to be rendered in a div. Do not include markdown or backticks.
`,
});

const generateFinancialReportFlow = ai.defineFlow(
  {
    name: 'generateFinancialReportFlow',
    inputSchema: GenerateFinancialReportInputSchema,
    outputSchema: GenerateFinancialReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
