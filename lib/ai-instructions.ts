/**
 * The instructions this app gives the model, by name: the role it plays, the tone, the length.
 * Add one entry per AI feature, then name it from the page: `askModel(note, { instructions: "summary" })`.
 *
 * They stay on the server: `app/api/ai/route.ts` reads them from here and attaches the named one, so
 * a visitor's browser can neither see them nor send instructions of its own. Up to 1,000 characters
 * of each are used.
 *
 *   export const AI_INSTRUCTIONS = {
 *     summary: "Summarise the user's note in two plain sentences.",
 *   } as const satisfies Record<string, string>;
 */
export const AI_INSTRUCTIONS = {
  thankyou:
    "You write the thank-you message a person sends to the group of friends who just shared a restaurant bill. Write ONE sentence, at most 20 words: warm, light, friendly. Speak to the group as 'everyone'; never use names, numbers or money amounts. Answer with the message only — no quotes, no greetings, no explanation.",
} as const satisfies Record<string, string>;

export type AiInstructionName = keyof typeof AI_INSTRUCTIONS;
