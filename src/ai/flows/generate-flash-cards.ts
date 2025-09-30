'use server';
/**
 * @fileOverview Generates flash cards based on a given topic or document.
 *
 * - generateFlashCards - A function that generates flash cards.
 * - GenerateFlashCardsInput - The input type for the generateFlashCards function.
 * - GenerateFlashCardsOutput - The return type for the generateFlashCards function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFlashCardsInputSchema = z.object({
  topic: z
    .string()
    .describe('The topic for which to generate the flash cards.'),
  documentDataUri: z
    .string()
    .optional()
    .describe(
      "A document related to the topic, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  numberOfCards: z
    .number()
    .default(5)
    .describe('The number of flash cards to generate.'),
});
export type GenerateFlashCardsInput = z.infer<typeof GenerateFlashCardsInputSchema>;

const GenerateFlashCardsOutputSchema = z.object({
  cards: z.array(
    z.object({
      front: z.string().describe('The front side of the flash card (term or question).'),
      back: z.string().describe('The back side of the flash card (definition or answer).'),
    })
  ).describe('The generated flash cards.'),
});
export type GenerateFlashCardsOutput = z.infer<typeof GenerateFlashCardsOutputSchema>;

export async function generateFlashCards(
  input: GenerateFlashCardsInput
): Promise<GenerateFlashCardsOutput> {
  return generateFlashCardsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFlashCardsPrompt',
  input: {schema: GenerateFlashCardsInputSchema},
  output: {schema: GenerateFlashCardsOutputSchema},
  prompt: `You are an expert in creating educational flash cards for UPSC aspirants.

  Generate {{numberOfCards}} flash cards based on the following topic and/or document.

  Topic: {{topic}}
  {{#if documentDataUri}}
  Document: {{media url=documentDataUri}}
  {{/if}}

  Each flash card should have a 'front' (a key term or a concise question) and a 'back' (the corresponding definition or answer).
  The output should be a JSON array of card objects.
  `,
});

const generateFlashCardsFlow = ai.defineFlow(
  {
    name: 'generateFlashCardsFlow',
    inputSchema: GenerateFlashCardsInputSchema,
    outputSchema: GenerateFlashCardsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
