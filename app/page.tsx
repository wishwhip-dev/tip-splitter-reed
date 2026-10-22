import { SplitHistory } from "@/components/split-history";
import { TipSplitter } from "@/components/tip-splitter";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-10 px-3 pb-safe pt-10 sm:px-6">
      <TipSplitter />
      <SplitHistory />
    </main>
  );
}
