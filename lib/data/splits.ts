import { database, type Split } from "@/lib/db";

/** Components call these, never Dexie directly. */

const splits = async () => (await database.ready()).splits;

/** Every saved split, newest first. */
export async function listSplits(): Promise<Split[]> {
  return (await splits()).orderBy("savedAt").reverse().toArray();
}

export async function addSplit(split: Split): Promise<void> {
  await (await splits()).put(split);
}

export async function deleteSplit(id: string): Promise<void> {
  await (await splits()).delete(id);
}
