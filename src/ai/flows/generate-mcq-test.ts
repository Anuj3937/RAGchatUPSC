'use server';
/**
 * @fileOverview Generates a multiple-choice question (MCQ) test based on a given topic or document.
 *
 * - generateMCQTest - A function that generates an MCQ test.
 * - GenerateMCQTestInput - The input type for the generateMCQTest function.
 * - GenerateMCQTestOutput - The return type for the generateMCQTest function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMCQTestInputSchema = z.object({
  topic: z
    .string()
    .describe('The topic for which to generate the MCQ test.'),
  documentDataUri: z
    .string()
    .optional()
    .describe(
      "A document related to the topic, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  numberOfQuestions: z
    .number()
    .default(5)
    .describe('The number of questions to generate for the test.'),
});
export type GenerateMCQTestInput = z.infer<typeof GenerateMCQTestInputSchema>;

const GenerateMCQTestOutputSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().describe('The MCQ question.'),
      options: z.array(z.string()).describe('The options for the question.'),
      answer: z.string().describe('The correct answer to the question.'),
    })
  ).describe('The generated MCQ test questions.'),
});
export type GenerateMCQTestOutput = z.infer<typeof GenerateMCQTestOutputSchema>;

export async function generateMCQTest(
  input: GenerateMCQTestInput
): Promise<GenerateMCQTestOutput> {
  return generateMCQTestFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateMCQTestPrompt',
  input: {schema: GenerateMCQTestInputSchema},
  output: {schema: GenerateMCQTestOutputSchema},
  prompt: `You are an expert in generating multiple-choice questions (MCQs) for UPSC aspirants.

  Generate {{numberOfQuestions}} MCQs based on the following topic and/or document.

  Topic: {{topic}}
  {{#if documentDataUri}}
  Document: {{media url=documentDataUri}}
  {{/if}}

  Each question should have four options, and clearly indicate the correct answer.
  The output should be a JSON array of question objects, each containing the question, options, and answer fields.
  `,
});

const generateMCQTestFlow = ai.defineFlow(
  {
    name: 'generateMCQTestFlow',
    inputSchema: GenerateMCQTestInputSchema,
    outputSchema: GenerateMCQTestOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
