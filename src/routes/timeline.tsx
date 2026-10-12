import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/lab/bits";
import { ScenarioView } from "@/components/lab/ScenarioView";
import { LTE_PACKETS, NR_PACKETS, SCENARIO_LABEL } from "@/lib/trace-data";
import { cn } from "@/lib/utils";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/timeline")({
  head: () => meta("Procedure Timeline", "Sequence diagram of LTE and 5G SA procedures grouped by step and synced with packet detail."),
  component: Page,
});

function Page() {
  const [s, setS] = useState<"lte" | "5gsa">("5gsa");
  return (
    <>
      <PageHeader eyebrow="Procedure Timeline" title="Message sequence">
        Messages are grouped by procedure step. Cyan arrows are control plane, green arrows are user plane. Selection is shared with the Trace Explorer.
      </PageHeader>
      <div role="tablist" className="mb-4 inline-flex rounded-md border border-border p-0.5">
        {(["lte", "5gsa"] as const).map((k) => (
          <button key={k} role="tab" aria-selected={s === k} onClick={() => setS(k)}
            className={cn("rounded px-3 py-1.5 text-sm", s === k ? "bg-primary text-primary-foreground" : "hover:bg-accent")}>
            {SCENARIO_LABEL[k]}
          </button>
        ))}
      </div>
      <ScenarioView scenario={s} packets={s === "lte" ? LTE_PACKETS : NR_PACKETS} />
    </>
  );
}
