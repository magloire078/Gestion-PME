'use server';

/**
 * @fileOverview Flow for generating financial reports based on tracked invoices and expenses.
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
  report: z.string().describe('A detailed financial report summarizing profitability and expenses.'),
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

Analyze the data and provide a comprehensive report including:
- Total Income
- Total Expenses
- Net Profit/Loss
- Key observations and trends
- Recommendations for improving profitability and reducing expenses.

Ensure the report is detailed, well-structured, and easy to understand for a business owner.
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
