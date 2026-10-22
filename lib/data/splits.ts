import { database, type Split } from "@/lib/db";

/** Components call these, never Dexie directly. */

const splits = async () => (await database.ready()).splits;

/** Every saved split, newest first.
 *
 * Sorted in the browser rather than with `.orderBy("savedAt")`: a stale database from an earlier
 * build can lack the savedAt index (its open then succeeds but reads over the index throw), and
 * the history must still list. `savedAt` is set on every write, so the sort is total.
 */
export async function listSplits(): Promise<Split[]> {
  const rows = await (await splits()).toArray();
  return rows.sort((a, b) => b.savedAt - a.savedAt);
}

/** Writes a split, stamping it with the current time when it does not carry one (an undone delete does). */
export async function addSplit(split: Omit<Split, "savedAt"> & { savedAt?: number }): Promise<void> {
  await (await splits()).put({ ...split, savedAt: split.savedAt ?? Date.now() });
}

export async function deleteSplit(id: string): Promise<void> {
  await (await splits()).delete(id);
}
