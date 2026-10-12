import { useState, type ReactNode } from "react";
import { ChevronRight, FlaskConical } from "lucide-react";
import type { DecodeNode, Packet } from "@/lib/trace-data";
import { cn } from "@/lib/utils";

export function DemoBadge({ label = "SAMPLE TRACE / DEMO DATA" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-sm border border-warn/50 bg-warn/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-warn">
      <FlaskConical className="h-3 w-3" aria-hidden /> {label}
    </span>
  );
}

const protoColor: Record<string, string> = {
  S1AP: "text-lte border-lte/40",
  "GTPv2-C": "text-lte border-lte/40",
  Diameter: "text-lte border-lte/40",
  NGAP: "text-nr border-nr/40",
  PFCP: "text-nr border-nr/40",
  "HTTP/2": "text-nr border-nr/40",
  "GTP-U": "text-user-plane border-user-plane/40",
};

export function ProtoTag({ p }: { p: string }) {
  return (
    <span className={cn("inline-block rounded-sm border px-1 font-mono text-[11px]", protoColor[p] ?? "text-muted-foreground border-border")}>
      {p}
    </span>
  );
}

export function PageHeader({ eyebrow, title, children, badge = true }: { eyebrow: string; title: string; children?: ReactNode; badge?: boolean }) {
  return (
    <header className="mb-5 border-b border-border pb-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="eyebrow">{eyebrow}</span>
        {badge && <DemoBadge />}
      </div>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h1>
      {children && <div className="mt-2 max-w-3xl text-sm text-muted-foreground">{children}</div>}
    </header>
  );
}

function TreeNode({ n, depth }: { n: DecodeNode; depth: number }) {
  const [open, setOpen] = useState(depth > 0 || n.label.length < 40);
  const has = !!n.children?.length;
  return (
    <li>
      <button
        type="button"
        onClick={() => has && setOpen(!open)}
        aria-expanded={has ? open : undefined}
        className="flex w-full items-start gap-1 rounded-sm px-1 py-0.5 text-left hover:bg-accent/40"
      >
        <ChevronRight className={cn("mt-0.5 h-3 w-3 shrink-0 transition-transform", has ? "" : "invisible", open && "rotate-90")} />
        <span className="text-foreground">{n.label}</span>
        {n.value !== undefined && <span className="text-primary">: {n.value}</span>}
      </button>
      {has && open && (
        <ul className="ml-3 border-l border-border pl-2">
          {n.children!.map((c, i) => (
            <TreeNode key={i} n={c} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function DecodeTree({ nodes }: { nodes: DecodeNode[] }) {
  return (
    <ul className="font-mono text-xs leading-relaxed">
      {nodes.map((n, i) => (
        <TreeNode key={n.label + i} n={n} depth={0} />
      ))}
    </ul>
  );
}

export function PacketDetail({ packet }: { packet: Packet | undefined }) {
  if (!packet)
    return (
      <div className="panel flex h-full min-h-40 items-center justify-center p-6 text-sm text-muted-foreground">
        Select a packet to see its decoded fields.
      </div>
    );
  return (
    <div className="panel flex h-full flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <span className="font-mono text-xs text-muted-foreground">#{packet.no}</span>
        <ProtoTag p={packet.protocol} />
        <span className="font-mono text-xs">{packet.iface}</span>
        <span className={cn("font-mono text-[10px] uppercase", packet.plane === "user" ? "text-user-plane" : "text-muted-foreground")}>{packet.plane} plane</span>
        {packet.demo ? <DemoBadge /> : <DemoBadge label="IMPORTED — USER DATA" />}
      </div>
      <div className="border-b border-border bg-surface-2 px-3 py-2 text-sm">
        <p className="eyebrow mb-1">Plain-language meaning</p>
        <p>{packet.explain || "No explanation provided for this record."}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {packet.srcNode} → {packet.dstNode} · {packet.step}
        </p>
      </div>
      <div className="flex-1 overflow-auto p-2">
        <DecodeTree nodes={packet.tree} />
        {packet.demo && (
          <p className="mt-3 px-1 text-[11px] text-muted-foreground">
            Field values are illustrative teaching values. Real captures may contain different or additional IEs.
          </p>
        )}
      </div>
    </div>
  );
}
