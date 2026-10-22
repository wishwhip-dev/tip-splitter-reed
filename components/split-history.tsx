"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { appConfig } from "@/app/config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useAppConfig } from "@/lib/config/react";
import { database, type Split } from "@/lib/db";
import { addSplit, deleteSplit, listSplits } from "@/lib/data/splits";
import { centsToText } from "@/lib/split";
import { useStoredQuery } from "@/lib/storage/react";

const chartConfig = {
  total: { label: "Total", color: "var(--chart-1)" },
} satisfies ChartConfig;

/** "Oct 22" — the label under each history row and each chart bar. */
function shortDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Every saved split, newest first, each deletable on its own — plus the chart of their totals. */
export function SplitHistory() {
  const { currency } = useAppConfig(appConfig);

  /**
   * The read behind the table and the chart, kept self-healing: a failed query reports itself
   * instead of looking like "no saved splits yet", and Retry re-runs it.
   */
  const [attempt, setAttempt] = useState(0);
  const { data, isLoading } = useStoredQuery(database, async () => {
    try {
      return { ok: true, rows: await listSplits() };
    } catch {
      return { ok: false };
    }
  }, [attempt]);
  const readFailed = data !== undefined && !data.ok;
  const splits = data?.ok ? data.rows : [];

  const deleteOne = async (split: Split) => {
    try {
      await deleteSplit(split.id);
      toast("Split deleted", {
        action: {
          label: "Undo",
          onClick: () => {
            void addSplit(split).catch((error) => {
              toast.error(`Could not undo: ${error instanceof Error ? error.message : "unknown error"}`);
            });
          },
        },
      });
    } catch (error) {
      toast.error(`Could not delete the split: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  };

  const splits = data ?? [];
  const chartData = splits.map((split) => ({ date: shortDate(split.savedAt), total: split.total / 100 }));

  return (
    <section aria-label="Saved splits" className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Saved splits</CardTitle>
          <CardDescription>Kept in this browser, newest first.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-2" aria-hidden="true">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-2/3" />
            </div>
          ) : readFailed ? (
            <div className="flex flex-col items-start gap-2 py-2">
              <p className="text-sm text-destructive">
                This browser did not hand back the saved splits — the list could not be read.
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => setAttempt((value) => value + 1)}>
                Retry
              </Button>
            </div>
          ) : splits.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">
              No saved splits yet. Fill in the bill above and press Save split — it will be listed here.
            </p>
          ) : (
            <Table>
              <TableCaption>Amounts in {currency} — per-person totals sum exactly to each split's total.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col" className="pl-0">Date</TableHead>
                  <TableHead scope="col" className="text-right">Bill</TableHead>
                  <TableHead scope="col" className="text-right">Tip</TableHead>
                  <TableHead scope="col" className="text-right">People</TableHead>
                  <TableHead scope="col" className="text-right">Total</TableHead>
                  <TableHead scope="col" className="text-right">Each</TableHead>
                  <TableHead scope="col" className="pr-0">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {splits.map((split) => (
                  <TableRow key={split.id}>
                    <TableCell className="whitespace-nowrap pl-0">
                      <time dateTime={new Date(split.savedAt).toISOString().slice(0, 10)}>{shortDate(split.savedAt)}</time>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">{centsToText(split.bill)}</TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">{split.tipPercent}%</TableCell>
                    <TableCell className="text-right tabular-nums">{split.people}</TableCell>
                    <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">{centsToText(split.total)}</TableCell>
                    <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">{centsToText(split.perPerson)}</TableCell>
                    <TableCell className="pr-0 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => void deleteOne(split)}
                        aria-label={`Delete the ${shortDate(split.savedAt)} split`}
                        className="h-8 px-2 text-destructive hover:text-destructive"
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Totals, split by split</CardTitle>
          <CardDescription>Each bar is one saved split, labelled by its date.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-56 w-full" aria-hidden="true" />
          ) : readFailed ? (
            <p className="py-2 text-sm text-destructive">Saved totals could not be read — press Retry on the list above.</p>
          ) : chartData.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">
              No saved splits yet — save one above and its total gets a bar here.
            </p>
          ) : (
            <ChartContainer config={chartConfig} className="h-56 w-full">
              <BarChart data={chartData} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  tickFormatter={(value: number) => `${currency}${value}`}
                />
                <ChartTooltip
                  content={<ChartTooltipContent indicator="line" />}
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                />
                <Bar dataKey="total" fill="var(--color-total)" radius={4} isAnimationActive={false} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </section>
  );
}