import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PageHeader, DemoBadge, ProtoTag } from "@/components/lab/bits";
import { LTE_PACKETS, NR_PACKETS } from "@/lib/trace-data";
import { useTrace } from "@/lib/trace-store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/")({
  head: () => meta("Lab Guide", "Overview of the LTE/EPC and 5G SA signaling teaching traces, supported protocols and demo-data status."),
  component: Index,
});

const PROTOS = [
  ["S1AP", "LTE", "eNB ↔ MME control (S1-MME), carries EPS NAS"],
  ["Diameter", "LTE", "MME ↔ HSS (S6a) authentication & subscription"],
  ["GTPv2-C", "LTE", "MME ↔ SGW (S11), SGW ↔ PGW (S5/S8) session control"],
  ["NGAP", "5G SA", "gNB ↔ AMF control (N2), carries 5G NAS (N1)"],
  ["HTTP/2", "5G SA", "Service-Based Interface between NFs (Nausf, Nudm, Nsmf, Namf)"],
  ["PFCP", "5G SA", "SMF ↔ UPF (N4) rule programming"],
  ["GTP-U", "Both", "User-plane tunnelling (S1-U, N3)"],
];

function Index() {
  const { imported, resetToDemo } = useTrace();
  return (
    <>
      <PageHeader eyebrow="Overview / Lab Guide" title="LTE/5G Signaling Analysis Lab">
        A protocol-learning and trace-analysis workbench. Walk through hand-authored teaching traces of an LTE/EPC attach and a
        5G Standalone registration + PDU session, inspect decoded fields, and practise structured troubleshooting. This is not a live network and
        not a replacement for Wireshark.
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        {[
          { to: "/lte" as const, title: "LTE / EPC Attach + Default Bearer", n: LTE_PACKETS.length, tone: "text-lte", desc: "S1AP · NAS EMM/ESM · Diameter S6a · GTPv2-C S11/S5 · GTP-U S1-U" },
          { to: "/5g-sa" as const, title: "5G SA Registration + PDU Session", n: NR_PACKETS.length, tone: "text-nr", desc: "NGAP · 5GMM/5GSM NAS · SBI HTTP/2 · PFCP N4 · GTP-U N3" },
        ].map((s) => (
          <Link key={s.to} to={s.to} className="panel group block p-4 hover:border-primary/60">
            <div className="flex items-center justify-between">
              <span className={`eyebrow ${s.tone}`}>Scenario</span>
              <DemoBadge />
            </div>
            <h2 className="mt-1 text-lg font-semibold">{s.title}</h2>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{s.desc}</p>
            <p className="mt-3 flex items-center gap-1 text-sm text-primary">
              {s.n} messages · open timeline <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <section className="panel p-4">
          <h2 className="eyebrow mb-3">Supported protocols (in sample traces)</h2>
          <table className="w-full text-sm">
            <tbody>
              {PROTOS.map(([p, gen, d]) => (
                <tr key={p} className="border-b border-border/50 last:border-0">
                  <td className="py-1.5 pr-3"><ProtoTag p={p} /></td>
                  <td className="py-1.5 pr-3 font-mono text-xs text-muted-foreground">{gen}</td>
                  <td className="py-1.5">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="panel p-4">
          <h2 className="eyebrow mb-3">Data status</h2>
          <ul className="space-y-2 text-sm">
            <li>• Seeded traces are <strong>hand-authored teaching examples</strong>, simplified and not complete or standards-validated captures.</li>
            <li>• All addresses use RFC 5737 documentation ranges; identities use the test PLMN 001/01.</li>
            <li>• Imported records: <span className="font-mono text-primary">{imported.length}</span> (stored only in this browser).</li>
          </ul>
          <button onClick={resetToDemo} className="mt-4 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent">
            Reset to demo data
          </button>
          <h2 className="eyebrow mb-2 mt-5">Suggested path</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li><Link to="/lte" className="text-primary hover:underline">LTE attach</Link> → note MME, SGW, PGW roles</li>
            <li><Link to="/5g-sa" className="text-primary hover:underline">5G SA</Link> → compare AMF/SMF/UPF split</li>
            <li><Link to="/pfcp" className="text-primary hover:underline">PFCP decoder</Link> → PDR/FAR/QER</li>
            <li><Link to="/troubleshooting" className="text-primary hover:underline">Troubleshooting</Link> drills</li>
          </ol>
        </section>
      </div>
    </>
  );
}
