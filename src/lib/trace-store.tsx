import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { z } from "zod";
import { DEMO_PACKETS, type DecodeNode, type Packet } from "./trace-data";

const KEY = "sigbench.imported.v1";

const decodeNodeSchema: z.ZodType<DecodeNode> = z.lazy(() =>
  z.object({
    label: z.string(),
    value: z.string().optional(),
    children: z.array(decodeNodeSchema).optional(),
  }),
);

const storedPacketSchema = z.object({
  id: z.string(),
  no: z.number().int().positive(),
  time: z.number().finite().nonnegative(),
  src: z.string(),
  dst: z.string(),
  srcNode: z.string(),
  dstNode: z.string(),
  protocol: z.string(),
  length: z.number().int().nonnegative(),
  info: z.string(),
  scenario: z.literal("imported"),
  step: z.string(),
  iface: z.string(),
  plane: z.enum(["control", "user"]),
  explain: z.string(),
  tree: z.array(decodeNodeSchema),
  demo: z.literal(false),
});

const storedPacketsSchema = z.array(storedPacketSchema).max(5000);

/** Parse persisted imports defensively; never trust browser storage to match the TypeScript type. */
export function parseStoredImportedPackets(raw: string): Packet[] | null {
  try {
    const result = storedPacketsSchema.safeParse(JSON.parse(raw));
    return result.success ? (result.data as Packet[]) : null;
  } catch {
    return null;
  }
}

interface Store {
  packets: Packet[];
  imported: Packet[];
  selectedId: string | null;
  persistenceError: string | null;
  select: (id: string | null) => void;
  setImported: (p: Packet[]) => void;
  resetToDemo: () => void;
}

const Ctx = createContext<Store | null>(null);

export function TraceProvider({ children }: { children: ReactNode }) {
  const [imported, setImportedState] = useState<Packet[]>([]);
  const [selectedId, select] = useState<string | null>(null);
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;

      const saved = parseStoredImportedPackets(raw);
      if (saved) {
        setImportedState(saved);
      } else {
        setPersistenceError("Saved imported trace data is invalid and was not loaded. Import the JSON file again to restore it.");
      }
    } catch {
      setPersistenceError("Browser storage is unavailable. Imported traces will only be available during this session.");
    }
  }, []);

  const value = useMemo<Store>(
    () => ({
      packets: [...DEMO_PACKETS, ...imported],
      imported,
      selectedId,
      persistenceError,
      select,
      setImported: (p) => {
        setImportedState(p);
        try {
          localStorage.setItem(KEY, JSON.stringify(p));
          setPersistenceError(null);
        } catch {
          setPersistenceError("Import succeeded for this session, but browser storage is unavailable or full. The trace may not persist after reload.");
        }
      },
      resetToDemo: () => {
        setImportedState([]);
        select(null);
        try {
          localStorage.removeItem(KEY);
          setPersistenceError(null);
        } catch {
          setPersistenceError("Imported traces were cleared from this session, but browser storage could not be cleared.");
        }
      },
    }),
    [imported, selectedId, persistenceError],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTrace() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTrace outside TraceProvider");
  return c;
}
