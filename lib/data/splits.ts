import { database, type Split } from "@/lib/db";

/** Components call these, never Dexie directly. */

const splits = async () => (await database.ready()).splits;

/** Every saved split, newest first. */
export async function listSplits(): Promise<Split[]> {
  return (await splits()).orderBy("savedAt").reverse().toArray();
}

/** Writes a split, stamping it with the current time when it does not carry one (an undone delete does). */
export async function addSplit(split: Omit<Split, "savedAt"> & { savedAt?: number }): Promise<void> {
  await (await splits()).put({ ...split, savedAt: split.savedAt ?? Date.now() });
}

export async function deleteSplit(id: string): Promise<void> {
  await (await splits()).delete(id);
}
