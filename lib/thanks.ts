"use client";

/**
 * The thank-you note under each saved split: asked from the model on a save or on a press of
 * Write thank-you / Try again, then stored with the split. Never called from render or on load.
 */
import { askModel } from "@/lib/ai";
import { saveThanks, setThanksStatus } from "@/lib/data/splits";
import { centsToText } from "@/lib/split";

/** The figures the prompt needs — the split's own numbers and nothing else. */
export type ThanksInput = {
  id: string;
  bill: number;
  tipPercent: number;
  people: number;
  total: number;
  perPerson: number;
};

/**
 * Asks the model for the message and saves it with the split. Resolves with nothing to act on:
 * success stores the message, failure marks the split "failed" so its row shows why, and only a
 * storage error rejects (the caller reports that).
 */
export async function generateThanks(split: ThanksInput): Promise<void> {
  await setThanksStatus(split.id, "writing");
  const result = await askModel(
    `A bill of ${centsToText(split.bill)} plus a ${split.tipPercent}% tip comes to `
    + `${centsToText(split.total)}, split ${split.people} ways (${centsToText(split.perPerson)} each). `
    + "Write the group a short, friendly thank-you.",
    { instructions: "thankyou", maxTokens: 80, temperature: 0.9 },
  );
  if (result.ok && result.text.trim()) {
    await saveThanks(split.id, result.text.trim());
  } else {
    await setThanksStatus(split.id, "failed");
  }
}
