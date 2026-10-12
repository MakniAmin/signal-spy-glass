import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/lab/bits";
import { RoleCards, ScenarioView } from "@/components/lab/ScenarioView";
import { NR_PACKETS } from "@/lib/trace-data";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/5g-sa")({
  head: () => meta("5G SA Registration + PDU Session", "Teaching trace of 5G Standalone registration and PDU session establishment across N1, N2, N3, N4 and SBI."),
  component: Page,
});

const IFACES = [
  ["N1", "UE ↔ AMF", "NAS (5GMM/5GSM). Logical; carried inside NGAP over N2.", "Control"],
  ["N2", "gNB ↔ AMF", "NGAP over SCTP.", "Control"],
  ["N3", "gNB ↔ UPF", "GTP-U over UDP 2152.", "User"],
  ["N4", "SMF ↔ UPF", "PFCP over UDP 8805.", "Control (of user plane)"],
  ["N6", "UPF ↔ DN", "Plain IP to the data network.", "User"],
  ["SBI", "NF ↔ NF", "HTTP/2 + JSON (Namf, Nsmf, Nausf, Nudm…).", "Control"],
];

function Page() {
  return (
    <>
      <PageHeader eyebrow="Scenario · 5G Standalone" title="Registration + PDU session establishment">
        Simplified teaching sequence. Some SBI calls (e.g. AUSF confirmation, SDM subscription, PCF policy) are omitted for clarity.{" "}
        <Link to="/explorer" search={{ scenario: "5gsa" }} className="text-primary hover:underline">Open in Trace Explorer →</Link>
      </PageHeader>
      <RoleCards
        roles={[
          { node: "UE", text: "Sends 5GMM (registration) and 5GSM (session) NAS to the AMF over N1." },
          { node: "gNB", text: "NR base station. NGAP to AMF on N2; GTP-U to UPF on N3." },
          { node: "AMF", text: "Registration, connection and mobility management; NAS termination; relays 5GSM to the SMF. Does not manage sessions itself." },
          { node: "AUSF", text: "Runs 5G-AKA / EAP-AKA' authentication with the UDM's help." },
          { node: "UDM", text: "Subscription data, SUCI de-concealment, registration of serving AMF." },
          { node: "SMF", text: "PDU session management, UE IP allocation, programs the UPF over N4 (PFCP)." },
          { node: "UPF", text: "User-plane forwarding & QoS enforcement per PDR/FAR/QER. No NAS awareness." },
        ]}
      />
      <div className="panel mb-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs text-muted-foreground">
            <tr><th className="px-3 py-1.5">Ref point</th><th className="px-3 py-1.5">Between</th><th className="px-3 py-1.5">Protocol</th><th className="px-3 py-1.5">Plane</th></tr>
          </thead>
          <tbody>
            {IFACES.map(([a, b, c, d]) => (
              <tr key={a} className="border-t border-border/60">
                <td className="px-3 py-1.5 font-mono text-primary">{a}</td><td className="px-3 py-1.5">{b}</td><td className="px-3 py-1.5">{c}</td>
                <td className={`px-3 py-1.5 font-mono text-xs ${d === "User" ? "text-user-plane" : "text-muted-foreground"}`}>{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ScenarioView scenario="5gsa" packets={NR_PACKETS} />
    </>
  );
}
