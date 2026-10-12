import { useTrace } from "@/lib/trace-store";
import { NODES, SCENARIO_NODES, type Packet } from "@/lib/trace-data";
import { Timeline } from "./Timeline";
import { PacketDetail } from "./bits";

export function ScenarioView({ scenario, packets }: { scenario: "lte" | "5gsa"; packets: Packet[] }) {
  const { selectedId, select } = useTrace();
  const sel = packets.find((p) => p.id === selectedId) ?? undefined;
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <Timeline packets={packets} nodes={SCENARIO_NODES[scenario]} selectedId={selectedId} onSelect={select} />
      <div className="xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)]">
        <PacketDetail packet={sel} />
      </div>
    </div>
  );
}

export function RoleCards({ roles }: { roles: { node: string; text: string }[] }) {
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {roles.map((r) => (
        <div key={r.node} className="panel p-3">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-mono text-sm font-semibold text-primary">{r.node}</h3>
            <span className="font-mono text-[10px] text-muted-foreground">{NODES[r.node]?.ip ?? "radio side"}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{r.text}</p>
        </div>
      ))}
    </div>
  );
}
