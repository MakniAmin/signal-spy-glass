import { useRef } from "react";
import type { Packet } from "@/lib/trace-data";
import { cn } from "@/lib/utils";
import { ProtoTag } from "./bits";

export function PacketTable({ packets, selectedId, onSelect }: { packets: Packet[]; selectedId: string | null; onSelect: (id: string) => void }) {
  const ref = useRef<HTMLTableSectionElement>(null);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const idx = packets.findIndex((p) => p.id === selectedId);
    const next = packets[Math.max(0, Math.min(packets.length - 1, idx + (e.key === "ArrowDown" ? 1 : -1)))];
    if (next) {
      onSelect(next.id);
      ref.current?.querySelector<HTMLElement>(`[data-id="${next.id}"]`)?.focus();
    }
  };

  if (!packets.length)
    return <div className="panel p-8 text-center text-sm text-muted-foreground">No packets match the current filters.</div>;

  return (
    <div className="panel max-h-[60vh] overflow-auto">
      <table className="w-full border-collapse font-mono text-xs" onKeyDown={onKey}>
        <thead className="sticky top-0 z-10 bg-surface-2 text-left text-muted-foreground">
          <tr>
            {["No.", "Time", "Source", "Destination", "Protocol", "Length", "Info"].map((h) => (
              <th key={h} scope="col" className="whitespace-nowrap border-b border-border px-2 py-1.5 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody ref={ref}>
          {packets.map((p) => {
            const sel = p.id === selectedId;
            return (
              <tr
                key={p.id}
                data-id={p.id}
                tabIndex={0}
                aria-selected={sel}
                onClick={() => onSelect(p.id)}
                onKeyDown={(e) => e.key === "Enter" && onSelect(p.id)}
                className={cn(
                  "cursor-pointer border-b border-border/50 outline-none hover:bg-accent/30 focus-visible:bg-accent/40",
                  sel && "bg-primary/20 hover:bg-primary/25",
                  p.plane === "user" && !sel && "bg-user-plane/5",
                )}
              >
                <td className="px-2 py-1 text-muted-foreground">{p.no}</td>
                <td className="px-2 py-1">{p.time.toFixed(6)}</td>
                <td className="whitespace-nowrap px-2 py-1">{p.src}</td>
                <td className="whitespace-nowrap px-2 py-1">{p.dst}</td>
                <td className="px-2 py-1"><ProtoTag p={p.protocol} /></td>
                <td className="px-2 py-1">{p.length}</td>
                <td className="min-w-[18rem] px-2 py-1">{p.info}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
