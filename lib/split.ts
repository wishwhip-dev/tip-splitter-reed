/**
 * The tip math, kept pure so the form, the saved record and the breakdown table all agree.
 *
 * Everything is counted in integer cents. Rounding is standard round-half-up at the cent, so a
 * $84.50 bill at 18% shows a $15.21 tip, a $99.71 total and $33.24 each.
 */

/** Decimal amount → cents, half-up. The epsilon nudges values like 1.005 (which floats render as 100.49999…) up to the half the person meant. */
export function toCents(amount: number): number {
  const scaled = amount * 100;
  return Math.round(scaled + Math.sign(scaled) * 1e-9);
}

/** Cents → "12.34", always exactly two decimal places. */
export function centsToText(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * A whole total shared `people` ways with no cent lost or invented: everyone gets the floor, and
 * the leftover cents go to the earliest rows, so the shares sum exactly to the total.
 */
export function distributeCents(totalCents: number, people: number): number[] {
  const base = Math.floor(totalCents / people);
  const remainder = totalCents - base * people;
  return Array.from({ length: people }, (_, index) => base + (index < remainder ? 1 : 0));
}

export type SplitRow = {
  /** 1-based person number. */
  person: number;
  /** This person's share of the tip, in cents. */
  tipCents: number;
  /** This person's share of the whole total, in cents. */
  owedCents: number;
};

export type SplitResult = {
  bill: number;
  tipPercent: number;
  people: number;
  /** The bill in cents. */
  billCents: number;
  /** The tip in cents. */
  tipCents: number;
  /** Bill plus tip, in cents. */
  totalCents: number;
  /** The headline per-person share: the total divided evenly, half-up. */
  perPersonCents: number;
  /** One row per person, in person order. The owed cents sum to the total, the tip cents to the tip. */
  rows: SplitRow[];
};

export function computeSplit(bill: number, tipPercent: number, people: number): SplitResult {
  const billCents = toCents(bill);
  const tipCents = toCents((bill * tipPercent) / 100);
  const totalCents = billCents + tipCents;
  const perPersonCents = Math.round(totalCents / people);
  const owed = distributeCents(totalCents, people);
  const tips = distributeCents(tipCents, people);
  return {
    bill,
    tipPercent,
    people,
    billCents,
    tipCents,
    totalCents,
    perPersonCents,
    rows: owed.map((owedCents, index) => ({ person: index + 1, tipCents: tips[index]!, owedCents })),
  };
}

/** The most people a split can be broken into; the breakdown table would run away past this. */
export const MAX_PEOPLE = 100;

export type SplitInputs = {
  bill: string;
  tipPercent: string;
  people: string;
};

export type SplitErrors = {
  bill?: string;
  tipPercent?: string;
  people?: string;
};

/**
 * Read the three typed values, or say what is wrong with each. An empty field is empty, not zero:
 * `Number("")` is 0, so blankness is checked before anything is turned into a number.
 */
export function parseSplitInputs(inputs: SplitInputs): { errors: SplitErrors; values?: { bill: number; tipPercent: number; people: number } } {
  const errors: SplitErrors = {};

  const billText = inputs.bill.trim();
  if (billText === "") errors.bill = "Enter the bill amount.";
  else {
    const bill = Number(billText);
    if (!Number.isFinite(bill)) errors.bill = "The bill amount must be a number, like 84.50.";
    else if (bill < 0) errors.bill = "The bill amount can't be negative.";
    else if (bill > 999_999) errors.bill = "The bill amount can't be over 999,999.";
  }

  const tipText = inputs.tipPercent.trim();
  if (tipText === "") errors.tipPercent = "Enter a tip percentage.";
  else {
    const tipPercent = Number(tipText);
    if (!Number.isFinite(tipPercent)) errors.tipPercent = "The tip percentage must be a number, like 17.5.";
    else if (tipPercent < 0) errors.tipPercent = "The tip percentage can't be below 0%.";
    else if (tipPercent > 100) errors.tipPercent = "The tip percentage can't be above 100%.";
  }

  const peopleText = inputs.people.trim();
  if (peopleText === "") errors.people = "Enter the number of people.";
  else {
    const people = Number(peopleText);
    if (!Number.isInteger(people)) errors.people = "The number of people must be a whole number.";
    else if (people < 1) errors.people = "The number of people must be at least 1.";
    else if (people > MAX_PEOPLE) errors.people = `The number of people can't be over ${MAX_PEOPLE}.`;
  }

  if (errors.bill || errors.tipPercent || errors.people) return { errors };
  return {
    errors,
    values: { bill: Number(billText), tipPercent: Number(tipText), people: Number(peopleText) },
  };
}
