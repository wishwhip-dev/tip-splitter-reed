"use client";

import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { appConfig } from "@/app/config";
import { ShareButton } from "@/components/share-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppConfig } from "@/lib/config/react";
import { database, newId, type Split } from "@/lib/db";
import { addSplit } from "@/lib/data/splits";
import {
  centsToText,
  computeSplit,
  parseSplitInputs,
  type SplitErrors,
  type SplitResult,
} from "@/lib/split";
import { useStorageStatus } from "@/lib/storage/react";
import { renderShareCard } from "@/lib/share";

type FieldProps = "bill" | "tipPercent" | "people";

/** The calculator: three inputs, the live split, the per-person table and the share button. */
export function TipSplitter() {
  const { title, currency, defaultTip, quickTips } = useAppConfig(appConfig);
  const storageStatus = useStorageStatus(database);

  const [bill, setBill] = useState("");
  // `null` means the form is still following the configured default tip; typing replaces it.
  const [tipInput, setTipInput] = useState<string | null>(null);
  const [people, setPeople] = useState("");
  const [saving, setSaving] = useState(false);
  // Errors only show for fields the person has typed into, or once a save or calculate was
  // attempted — so a untouched form, and a freshly reset one, are blank and quiet.
  const [attempted, setAttempted] = useState(false);
  const [touched, setTouched] = useState({ bill: false, tip: false, people: false });
  const markTouched = (field: "bill" | "tip" | "people") =>
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));

  const billRef = useRef<HTMLInputElement>(null);
  const tipRef = useRef<HTMLInputElement>(null);
  const peopleRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLElement>(null);

  const tipText = tipInput ?? String(defaultTip);
  const { errors, values } = parseSplitInputs({ bill, tipPercent: tipText, people });
  const result = values ? computeSplit(values.bill, values.tipPercent, values.people) : undefined;

  const money = (cents: number) => `${currency}${centsToText(cents)}`;

  const billError = errors.bill && (touched.bill || attempted) ? errors.bill : undefined;
  const tipError = errors.tipPercent && (touched.tip || attempted) ? errors.tipPercent : undefined;
  const peopleError = errors.people && (touched.people || attempted) ? errors.people : undefined;

  /** Enter anywhere in the form saves the split; invalid values are refused before any write. */
  const saveSplit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttempted(true);
    if (!result || !values || saving) return;
    setSaving(true);
    const record: Omit<Split, "savedAt"> = {
      id: newId(),
      bill: values.bill,
      tipPercent: values.tipPercent,
      people: values.people,
      tipAmount: result.tipCents,
      total: result.totalCents,
      perPerson: result.perPersonCents,
    };
    try {
      await addSplit(record);
      toast.success(`Saved: ${money(result.totalCents)} total, ${money(result.perPersonCents)} each`);
    } catch (error) {
      toast.error(`Could not save the split: ${error instanceof Error ? error.message : "unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  /** Calculate scrolls to what it calculated, or lands on the first field it could not. */
  const calculate = () => {
    setAttempted(true);
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      resultRef.current.focus();
      return;
    }
    const order: { field: FieldProps; ref: React.RefObject<HTMLInputElement | null> }[] = [
      { field: "bill", ref: billRef },
      { field: "tipPercent", ref: tipRef },
      { field: "people", ref: peopleRef },
    ];
    const first = order.find(({ field }) => errors[field]);
    (first?.ref ?? billRef).current?.focus();
  };

  /** Reset clears the form back to empty and hides the result; the saved history is not touched. */
  const resetFields = () => {
    const previous = { bill, tipInput, people };
    setBill("");
    setTipInput("");
    setPeople("");
    setTouched({ bill: false, tip: false, people: false });
    setAttempted(false);
    toast("Fields cleared", {
      description: "The result and breakdown were removed. Saved splits are untouched.",
      action: {
        label: "Undo",
        onClick: () => {
          setBill(previous.bill);
          setTipInput(previous.tipInput);
          setPeople(previous.people);
          setTouched({ bill: true, tip: true, people: true });
        },
      },
    });
  };

  const resultTitle = result ? `Split result: ${money(result.perPersonCents)} each` : "Split result";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight text-balance">{title}</h1>
        <p className="text-muted-foreground">Enter the bill, the tip and the table — see what each person pays.</p>
      </header>

      {storageStatus === "memory" ? (
        <Alert>
          <AlertTitle>This browser will not keep your data</AlertTitle>
          <AlertDescription>
            Storage was refused here, so saved splits last only until this tab closes.
          </AlertDescription>
        </Alert>
      ) : null}

      <form onSubmit={saveSplit} noValidate className="flex flex-col gap-4" aria-label="Tip calculator">
        <div className="flex flex-col gap-2">
          <Label htmlFor="bill">Bill amount</Label>
          <div className="relative">
            <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
              {currency}
            </span>
            <Input
              ref={billRef}
              id="bill"
              name="bill"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="84.50"
              value={bill}
              onChange={(event) => {
                setBill(event.target.value);
                markTouched("bill");
              }}
              aria-invalid={billError ? true : undefined}
              aria-describedby={billError ? "bill-error" : undefined}
              className="pl-9 text-base"
            />
          </div>
          <FieldError id="bill-error" message={billError} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tip">Tip percentage</Label>
            <Input
              ref={tipRef}
              id="tip"
              name="tipPercent"
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              max="100"
              placeholder="18"
              value={tipText}
              onChange={(event) => {
                setTipInput(event.target.value);
                markTouched("tip");
              }}
              aria-invalid={tipError ? true : undefined}
              aria-describedby={tipError ? "tip-error" : undefined}
              className="text-base"
            />
            <FieldError id="tip-error" message={tipError} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="people">People</Label>
            <Input
              ref={peopleRef}
              id="people"
              name="people"
              type="number"
              inputMode="numeric"
              step="1"
              min="1"
              placeholder="3"
              value={people}
              onChange={(event) => {
                setPeople(event.target.value);
                markTouched("people");
              }}
              aria-invalid={peopleError ? true : undefined}
              aria-describedby={peopleError ? "people-error" : undefined}
              className="text-base"
            />
            <FieldError id="people-error" message={peopleError} />
          </div>
        </div>

        <QuickTips
          presets={quickTips}
          value={tipText}
          onPick={(preset) => {
            setTipInput(preset);
            markTouched("tip");
          }}
        />

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={calculate} className="min-w-28 flex-1 sm:flex-none">
            Calculate
          </Button>
          <Button type="button" variant="outline" onClick={resetFields} className="min-w-28 flex-1 sm:flex-none">
            Reset
          </Button>
          <Button type="submit" disabled={saving} className="min-w-28 flex-1 sm:flex-none">
            {saving ? "Saving…" : "Save split"}
          </Button>
        </div>
      </form>

      {result ? (
        <section ref={resultRef} tabIndex={-1} aria-label={`Split result: ${money(result.perPersonCents)} each`} className="flex flex-col gap-4 outline-none">
          <SplitReadout result={result} money={money} peopleText={people.trim()} tipText={tipText} />

            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableCaption>Per-person breakdown — the shares sum to {money(result.totalCents)}</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col" className="pl-0">Person</TableHead>
                      <TableHead scope="col" className="text-right">Tip share</TableHead>
                      <TableHead scope="col" className="pr-0 text-right">Total owed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.rows.map((row) => (
                      <TableRow key={row.person}>
                        <TableCell className="pl-0 font-medium">{row.person}</TableCell>
                        <TableCell className="text-right tabular-nums">{money(row.tipCents)}</TableCell>
                        <TableCell className="pr-0 text-right font-medium tabular-nums">{money(row.owedCents)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <ShareButton
              label="Share split"
              cacheKey={`${bill}|${tipText}|${people}`}
              title={`${title}: ${money(result.totalCents)} total`}
              text={`A ${money(result.billCents)} bill with ${tipText}% tip for ${result.people} — ${money(result.perPersonCents)} each.`}
              filename="tip-split.png"
              makeImage={() =>
                renderShareCard({
                  title: `${money(result.perPersonCents)} each`,
                  subtitle: `${result.people} people · ${tipText}% tip`,
                  lines: [
                    `Bill: ${money(result.billCents)}`,
                    `Tip: ${money(result.tipCents)}`,
                    `Total: ${money(result.totalCents)}`,
                  ],
                  format: "square",
                })
              }
            />
        </section>
      ) : null}
    </div>
  );
}

/** The inline, named problem under a field. Nothing renders while the value is fine. */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-sm text-destructive">
      {message}
    </p>
  );
}

function QuickTips({
  presets,
  value,
  onPick,
}: {
  presets: readonly string[];
  value: string;
  onPick: (preset: string) => void;
}) {
  const current = Number(value);
  return (
    <div role="group" aria-label="Quick tip percentages" className="flex flex-wrap gap-2">
      {presets.map((preset) => {
        const active = Number.isFinite(current) && current === Number(preset);
        return (
          <Button
            key={preset}
            type="button"
            variant={active ? "default" : "outline"}
            size="sm"
            aria-pressed={active}
            onClick={() => onPick(preset)}
            className="min-w-14"
          >
            {preset}%
          </Button>
        );
      })}
    </div>
  );
}

/**
 * The live readout. While the values are valid the per-person share is the largest figure on the
 * panel, with the tip and the total smaller beneath it; while they are not, there are no figures.
 */
function SplitReadout({
  result,
  errors,
  money,
  peopleText,
  tipText,
}: {
  result: SplitResult | undefined;
  errors: SplitErrors;
  money: (cents: number) => string;
  peopleText: string;
  tipText: string;
}) {
  if (!result) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col gap-1 pt-6 text-center">
          <p className="font-medium">No split to show yet</p>
          <p className="text-sm text-muted-foreground">
            {errors.bill ?? errors.tipPercent ?? errors.people ?? "Enter a bill, a tip and how many people."}
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Each of {peopleText || String(result.people)} pays, at {tipText}% tip
        </p>
        <p aria-live="polite" className="text-5xl font-semibold tabular-nums tracking-tight">
          {money(result.perPersonCents)}
        </p>
        <dl className="grid w-full grid-cols-2 gap-2 pt-1">
          <div className="rounded-lg bg-muted/60 px-3 py-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tip amount</dt>
            <dd className="text-lg font-medium tabular-nums">{money(result.tipCents)}</dd>
          </div>
          <div className="rounded-lg bg-muted/60 px-3 py-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total with tip</dt>
            <dd className="text-lg font-medium tabular-nums">{money(result.totalCents)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
