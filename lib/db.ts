/**
 * This application's database.
 *
 * The reusable half of the setup is in `lib/storage/` and is not edited. This file is the half
 * that describes the product: which tables exist, what is indexed, how the schema has changed over
 * time, and what a first visit starts with.
 */
import { defineDatabase } from "@/lib/storage/database";

/** One saved split: the numbers as they were calculated the moment Save was pressed. */
export type Split = {
  id: string;
  /** Epoch millis. Indexed, because the history is listed newest first. */
  savedAt: number;
  /** The bill, before tip. */
  bill: number;
  /** The tip percentage that was applied. */
  tipPercent: number;
  /** How many ways the total was split. */
  people: number;
  /** The tip in cents. */
  tipAmount: number;
  /** Bill plus tip, in cents. */
  total: number;
  /** The headline per-person share, in cents (total divided evenly, half-up). */
  perPerson: number;
};

/** Ids are generated here so the data layer never depends on an auto-increment round trip. */
export function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const database = defineDatabase<{ splits: Split }>({
  // Part of the origin's storage identity. Renaming it does not migrate anything — it points the
  // application at a different, empty database and abandons the old one in place. That is exactly
  // what you want on a first build, and never what you want afterwards.
  name: "tip-splitter",
  versions: [
    // Only the primary key and the property the history is ordered by. The amounts are stored but
    // never filtered or sorted by, so indexing them would cost writes and buy nothing.
    { version: 1, stores: { splits: "id, savedAt" } },
  ],
  // No seed: an empty history is a designed state ("No saved splits yet"), not a broken-looking one.
});
