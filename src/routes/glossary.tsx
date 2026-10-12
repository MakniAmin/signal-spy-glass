import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/lab/bits";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/glossary")({
  head: () => meta("Learning Notes & Glossary", "Searchable LTE EPC and 5G Core glossary with an accurate side-by-side function comparison."),
  component: Page,
});

const TERMS: [string, string, string][] = [
  ["AMF", "5GC", "Access and Mobility Management Function. Registration, reachability, mobility, NAS termination. Session management moved to the SMF."],
  ["AUSF", "5GC", "Authentication Server Function. Performs 5G-AKA / EAP-AKA' for the serving network."],
  ["DNN", "5GC", "Data Network Name — the 5G equivalent of an APN."],
  ["APN", "EPC", "Access Point Name — identifies the PDN a bearer connects to."],
  ["EPS bearer", "EPC", "End-to-end QoS tunnel (UE–PGW) identified by EBI; the default bearer is created at attach."],
  ["QoS flow", "5GC", "Finest QoS granularity in a PDU session, identified by QFI. Replaces per-bearer QoS."],
  ["PDU session", "5GC", "Association between UE and a data network (IPv4/IPv6/Ethernet/Unstructured). Not created automatically at registration in 5G SA."],
  ["F-TEID", "Both", "Fully-qualified Tunnel Endpoint ID: TEID + IP address."],
  ["F-SEID", "5GC/CUPS", "Fully-qualified PFCP Session Endpoint ID: SEID + IP address."],
  ["PDR / FAR / QER / URR", "PFCP", "Detection, forwarding, QoS enforcement and usage reporting rules installed in the UPF."],
  ["GUTI / 5G-GUTI", "Both", "Temporary identity assigned by MME/AMF to avoid sending IMSI/SUPI."],
  ["SUPI / SUCI", "5GC", "Permanent subscriber identity / its concealed form sent over the air."],
  ["IMSI", "EPC", "International Mobile Subscriber Identity."],
  ["HSS", "EPC", "Home Subscriber Server; Diameter S6a to MME."],
  ["UDM / UDR", "5GC", "Unified Data Management (front-end logic) and Repository (storage)."],
  ["MME", "EPC", "Mobility Management Entity — EPC control plane for NAS, mobility AND bearer signalling toward SGW. Not identical to AMF."],
  ["SGW", "EPC", "Serving Gateway; user-plane anchor for inter-eNB mobility."],
  ["PGW", "EPC", "PDN Gateway; IP allocation, policy enforcement, SGi."],
  ["SMF", "5GC", "Session Management Function; PDU sessions, IP allocation, UPF control via N4."],
  ["UPF", "5GC", "User Plane Function; can play anchor (PSA) and intermediate roles. Not one-to-one with SGW or PGW."],
  ["CUPS", "EPC", "Control/User Plane Separation (Rel-14) splitting SGW/PGW into -C and -U, also using PFCP (Sxa/Sxb)."],
  ["NAS", "Both", "Non-Access Stratum: UE↔MME (EMM/ESM) or UE↔AMF (5GMM/5GSM)."],
  ["S1AP / NGAP", "Both", "RAN-to-core control protocol: eNB↔MME / gNB↔AMF over SCTP."],
  ["SBI", "5GC", "Service-Based Interface: NFs expose HTTP/2 REST APIs (Nxxx)."],
];

const CMP = [
  ["Mobility & NAS", "MME", "AMF"],
  ["Session management", "MME (ESM) + SGW-C/PGW-C", "SMF"],
  ["User plane", "SGW (-U) + PGW (-U)", "UPF (one or more, chained)"],
  ["Subscriber data", "HSS (Diameter)", "UDM/UDR (SBI)"],
  ["Authentication", "MME + HSS (EPS-AKA)", "AMF/SEAF + AUSF + UDM (5G-AKA, EAP-AKA')"],
  ["Policy", "PCRF (Gx)", "PCF (Npcf)"],
  ["Core signaling style", "Point-to-point (Diameter, GTPv2-C)", "Service-based (HTTP/2) + N1/N2/N4 point-to-point"],
  ["QoS unit", "EPS bearer (QCI)", "QoS flow (5QI, QFI)"],
  ["Connectivity at attach", "Default bearer always established", "Registration and PDU session are separate"],
];

function Page() {
  const [q, setQ] = useState("");
  const n = q.trim().toLowerCase();
  const terms = TERMS.filter((t) => !n || t.join(" ").toLowerCase().includes(n));
  return (
    <>
      <PageHeader eyebrow="Learning Notes" title="Glossary & EPC vs 5GC" badge={false}>
        5G Core is not a renamed EPC. Mappings below are functional approximations — e.g. the MME's responsibilities split across AMF and SMF, and the UPF covers roles that SGW-U and PGW-U had.
      </PageHeader>
      <section className="panel mb-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs text-muted-foreground">
            <tr><th className="px-3 py-2">Function</th><th className="px-3 py-2 text-lte">LTE / EPC</th><th className="px-3 py-2 text-nr">5G Core (SA)</th></tr>
          </thead>
          <tbody>
            {CMP.map(([a, b, c]) => (
              <tr key={a} className="border-t border-border/60"><td className="px-3 py-1.5 text-muted-foreground">{a}</td><td className="px-3 py-1.5">{b}</td><td className="px-3 py-1.5">{c}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
      <label className="mb-3 flex max-w-sm flex-col gap-1 text-xs text-muted-foreground">
        Search glossary
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. TEID, AMF, QoS" className="rounded-md border border-input bg-surface px-2 py-1.5 text-sm text-foreground" />
      </label>
      {terms.length === 0 ? (
        <p className="panel p-6 text-center text-sm text-muted-foreground">No terms match “{q}”.</p>
      ) : (
        <dl className="grid gap-2 md:grid-cols-2">
          {terms.map(([t, g, d]) => (
            <div key={t} className="panel p-3">
              <dt className="flex items-baseline justify-between"><span className="font-mono font-semibold text-primary">{t}</span><span className="font-mono text-[10px] text-muted-foreground">{g}</span></dt>
              <dd className="mt-1 text-sm text-muted-foreground">{d}</dd>
            </div>
          ))}
        </dl>
      )}
    </>
  );
}
