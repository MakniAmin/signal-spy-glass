import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, DecodeTree, DemoBadge } from "@/components/lab/bits";
import { toTree } from "@/lib/trace-data";
import { cn } from "@/lib/utils";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/pfcp")({
  head: () => meta("PFCP Analysis", "Decoder-style walk-through of a sample PFCP Session Establishment Request on N4: header, SEID, Node ID, F-SEID, PDR, FAR, QER."),
  component: Page,
});

const HEADER = [
  ["Version", "1", "PFCP version."],
  ["S flag", "1", "SEID field present. Node-related messages (e.g. Heartbeat, Association Setup) have S=0; session-related messages have S=1."],
  ["Message Type", "50 (Session Establishment Request)", "Response is type 51. Modification = 52/53, Deletion = 54/55."],
  ["Message Length", "illustrative", "Length after the first 4 octets of the header."],
  ["SEID", "0x0000000000000000", "In the establishment request the SMF does not yet know the UPF's SEID, so the header SEID is 0. The SMF advertises its own SEID in the F-SEID IE."],
  ["Sequence Number", "1201", "Correlates request and response; the response echoes it."],
];

const IES: { key: string; title: string; desc: string; fields: Record<string, string | Record<string, string>> }[] = [
  { key: "node", title: "Node ID", desc: "Identifies the sending CP function (here an IPv4 address). Must match an existing PFCP association.", fields: { Type: "IPv4 address (0)", "Node ID IPv4": "198.51.100.30" } },
  { key: "fseid", title: "F-SEID (CP)", desc: "Fully-qualified SEID of the SMF for this session. The UPF uses this SEID in the header of messages it sends back.", fields: { Flags: "V4", SEID: "0x0000000000000a01", IPv4: "198.51.100.30" } },
  { key: "pdr1", title: "Create PDR #1 (uplink)", desc: "Packet Detection Rule: matches packets arriving from Access (N3). F-TEID CHOOSE asks the UPF to allocate the N3 TEID.", fields: { "PDR ID": "1", Precedence: "255", PDI: { "Source Interface": "Access (0)", "F-TEID": "CH=1 (UPF chooses)", "Network Instance": "access (illustrative)", QFI: "1" }, "Outer Header Removal": "GTP-U/UDP/IPv4 (0)", "FAR ID": "1", "QER ID": "1" } },
  { key: "pdr2", title: "Create PDR #2 (downlink)", desc: "Matches packets from Core (N6) destined to the UE IP.", fields: { "PDR ID": "2", Precedence: "255", PDI: { "Source Interface": "Core (1)", "UE IP Address": "10.45.0.7 (destination)" }, "FAR ID": "2", "QER ID": "1" } },
  { key: "far1", title: "Create FAR #1", desc: "Forwarding Action Rule: forward uplink to the Core / N6.", fields: { "FAR ID": "1", "Apply Action": "FORW", "Forwarding Parameters": { "Destination Interface": "Core (1)", "Network Instance": "internet (illustrative)" } } },
  { key: "far2", title: "Create FAR #2", desc: "Downlink initially BUFFERs because the gNB TEID is not known; later a Session Modification sets FORW + Outer Header Creation.", fields: { "FAR ID": "2", "Apply Action": "BUFF (illustrative initial state)" } },
  { key: "qer", title: "Create QER", desc: "QoS Enforcement Rule: gate status and bit-rate limits; QFI marking.", fields: { "QER ID": "1", "Gate Status": "UL OPEN / DL OPEN", MBR: "UL/DL illustrative", QFI: "1" } },
];

function Page() {
  const [active, setActive] = useState("node");
  const ie = IES.find((i) => i.key === active)!;
  return (
    <>
      <PageHeader eyebrow="PFCP Analysis · N4" title="Session Establishment Request (sample)">
        All values are illustrative. Exact IE presence depends on the actual packet, the SMF/UPF implementation and the session's
        configuration (e.g. URRs for usage reporting, BAR for buffering, Ethernet PDRs). This panel does not validate protocol conformance.
      </PageHeader>
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="panel overflow-hidden">
          <h2 className="eyebrow border-b border-border px-3 py-2">PFCP header</h2>
          <table className="w-full text-sm">
            <tbody>
              {HEADER.map(([f, v, d]) => (
                <tr key={f} className="border-b border-border/50 align-top last:border-0">
                  <td className="w-36 px-3 py-2 font-mono text-xs">{f}</td>
                  <td className="w-48 px-3 py-2 font-mono text-xs text-primary">{v}</td>
                  <td className="px-3 py-2 text-muted-foreground">{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <h2 className="eyebrow">Information elements</h2>
            <DemoBadge />
          </div>
          <div className="flex flex-wrap gap-1 border-b border-border p-2" role="tablist">
            {IES.map((i) => (
              <button key={i.key} role="tab" aria-selected={active === i.key} onClick={() => setActive(i.key)}
                className={cn("rounded px-2 py-1 font-mono text-xs", active === i.key ? "bg-primary text-primary-foreground" : "bg-surface-2 hover:bg-accent")}>
                {i.title}
              </button>
            ))}
          </div>
          <div className="p-3">
            <p className="mb-2 text-sm">{ie.desc}</p>
            <DecodeTree nodes={toTree({ [ie.title]: ie.fields })} />
          </div>
        </section>
      </div>
      <section className="panel mt-4 p-4 text-sm">
        <h2 className="eyebrow mb-2">How the rules chain together</h2>
        <pre className="overflow-x-auto font-mono text-xs text-muted-foreground">{`UL:  N3 GTP-U (TEID 0x00000101) ──► PDR 1 (src=Access) ──► QER 1 ──► FAR 1 FORW ──► N6 / DN
DL:  N6 dst=10.45.0.7         ──► PDR 2 (src=Core)   ──► QER 1 ──► FAR 2 BUFF → (after Mod) FORW + OHC → gNB TEID`}</pre>
        <p className="mt-3 text-muted-foreground">
          Wireshark display filters: <code className="text-primary">pfcp</code>, <code className="text-primary">pfcp.msg_type == 50</code>,{" "}
          <code className="text-primary">pfcp.seid == 0x0a01</code>, <code className="text-primary">pfcp.cause != 1</code>.
        </p>
      </section>
    </>
  );
}
