import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, PacketDetail } from "@/components/lab/bits";
import { PacketTable } from "@/components/lab/PacketTable";
import { useTrace } from "@/lib/trace-store";
import { SCENARIO_LABEL, type Scenario } from "@/lib/trace-data";
import { meta } from "@/lib/meta";

type Search = { scenario?: Scenario | "all" };

export const Route = createFileRoute("/explorer")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const v = s["scenario"];
    return v === "lte" || v === "5gsa" || v === "imported" || v === "all" ? { scenario: v } : {};
  },
  head: () => meta("Trace Explorer", "Wireshark-inspired packet list with search, protocol and scenario filters and a decode-tree detail pane."),
  component: Explorer,
});

const sel = "rounded-md border border-input bg-surface px-2 py-1.5 text-sm";

function Explorer() {
  const { packets, selectedId, select } = useTrace();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const scenario = search.scenario ?? "all";
  const [q, setQ] = useState("");
  const [proto, setProto] = useState("all");

  const protos = useMemo(() => [...new Set(packets.map((p) => p.protocol))].sort(), [packets]);
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return packets.filter(
      (p) =>
        (scenario === "all" || p.scenario === scenario) &&
        (proto === "all" || p.protocol === proto) &&
        (!needle || [p.info, p.src, p.dst, p.srcNode, p.dstNode, p.protocol, p.iface].some((f) => f.toLowerCase().includes(needle))),
    );
  }, [packets, q, proto, scenario]);
  const current = packets.find((p) => p.id === selectedId);

  return (
    <>
      <PageHeader eyebrow="Trace Explorer" title="Packet list">
        Click a row or use ↑/↓ to step through packets. Search matches info, addresses, node names and interfaces.
      </PageHeader>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Search
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Create Session, N4, 192.0.2.30" className={`${sel} w-72 font-mono text-foreground`} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Protocol
          <select value={proto} onChange={(e) => setProto(e.target.value)} className={`${sel} text-foreground`}>
            <option value="all">All protocols</option>
            {protos.map((p) => <option key={p}>{p}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Scenario
          <select value={scenario} onChange={(e) => navigate({ search: { scenario: e.target.value as Scenario | "all" } })} className={`${sel} text-foreground`}>
            <option value="all">All scenarios</option>
            {(Object.keys(SCENARIO_LABEL) as Scenario[]).map((s) => <option key={s} value={s}>{SCENARIO_LABEL[s]}</option>)}
          </select>
        </label>
        {(q || proto !== "all" || scenario !== "all") && (
          <button onClick={() => { setQ(""); setProto("all"); navigate({ search: {} }); }} className="rounded-md px-2 py-1.5 text-sm text-primary hover:bg-accent">
            Clear filters
          </button>
        )}
        <span className="ml-auto font-mono text-xs text-muted-foreground">Displayed: {rows.length} / {packets.length}</span>
      </div>
      <div className="grid gap-4 2xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <PacketTable packets={rows} selectedId={selectedId} onSelect={select} />
        <div className="min-h-72"><PacketDetail packet={current} /></div>
      </div>
    </>
  );
}
