import type { Packet } from "@/lib/trace-data";
import { cn } from "@/lib/utils";
import { ProtoTag } from "./bits";

export function Timeline({ packets, nodes, selectedId, onSelect }: { packets: Packet[]; nodes: string[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const steps: { step: string; items: Packet[] }[] = [];
  for (const p of packets) {
    const last = steps[steps.length - 1];
    if (last && last.step === p.step) last.items.push(p);
    else steps.push({ step: p.step, items: [p] });
  }
  const col = (n: string) => Math.max(0, nodes.indexOf(n));
  const pct = (i: number) => ((i + 0.5) / nodes.length) * 100;

  if (!packets.length) return <div className="panel p-8 text-center text-sm text-muted-foreground">No messages in this scenario.</div>;

  return (
    <div className="panel overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="sticky top-0 z-10 grid border-b border-border bg-surface-2" style={{ gridTemplateColumns: `repeat(${nodes.length}, 1fr)` }}>
          {nodes.map((n) => (
            <div key={n} className="py-2 text-center font-mono text-xs font-semibold text-primary">{n}</div>
          ))}
        </div>
        {steps.map((s) => (
          <section key={s.step}>
            <h3 className="eyebrow border-b border-border/60 bg-background/40 px-3 py-1">{s.step}</h3>
            {s.items.map((p) => {
              const a = col(p.srcNode), b = col(p.dstNode);
              const left = pct(Math.min(a, b)), right = pct(Math.max(a, b));
              const ltr = b >= a;
              const sel = p.id === selectedId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelect(p.id)}
                  aria-pressed={sel}
                  className={cn("relative block h-14 w-full text-left hover:bg-accent/25", sel && "bg-primary/15")}
                >
                  {nodes.map((n, i) => (
                    <span key={n} aria-hidden className="absolute top-0 bottom-0 w-px bg-border" style={{ left: `${pct(i)}%` }} />
                  ))}
                  <span
                    className="absolute top-1 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap text-[11px]"
                    style={{ left: `${Math.min(Math.max((left + right) / 2, 24), 68)}%` }}
                  >
                    <span className="font-mono text-muted-foreground">#{p.no}</span>
                    <ProtoTag p={p.protocol} />
                    <span className={cn("max-w-[22rem] truncate", sel ? "text-foreground" : "text-foreground/85")}>{(p.info.split(",").pop() ?? "").trim()}</span>
                  </span>
                  <span
                    aria-hidden
                    className={cn("absolute top-9 h-0.5", p.plane === "user" ? "bg-user-plane" : "bg-primary", sel && "h-[3px]")}
                    style={{ left: `${left}%`, width: `${right - left}%` }}
                  >
                    <span
                      className={cn(
                        "absolute -top-[5px] h-0 w-0 border-y-[6px] border-y-transparent",
                        ltr ? "right-0 border-l-[8px]" : "left-0 border-r-[8px]",
                        p.plane === "user" ? (ltr ? "border-l-user-plane" : "border-r-user-plane") : ltr ? "border-l-primary" : "border-r-primary",
                      )}
                    />
                  </span>
                  <span className="sr-only">{p.srcNode} to {p.dstNode}: {p.info}</span>
                </button>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
