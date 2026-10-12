import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEMO_PACKETS, type Packet } from "./trace-data";

const KEY = "sigbench.imported.v1";

interface Store {
  packets: Packet[];
  imported: Packet[];
  selectedId: string | null;
  select: (id: string | null) => void;
  setImported: (p: Packet[]) => void;
  resetToDemo: () => void;
}

const Ctx = createContext<Store | null>(null);

export function TraceProvider({ children }: { children: ReactNode }) {
  const [imported, setImportedState] = useState<Packet[]>([]);
  const [selectedId, select] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setImportedState(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<Store>(
    () => ({
      packets: [...DEMO_PACKETS, ...imported],
      imported,
      selectedId,
      select,
      setImported: (p) => {
        setImportedState(p);
        localStorage.setItem(KEY, JSON.stringify(p));
      },
      resetToDemo: () => {
        setImportedState([]);
        localStorage.removeItem(KEY);
        select(null);
      },
    }),
    [imported, selectedId],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTrace() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTrace outside TraceProvider");
  return c;
}
