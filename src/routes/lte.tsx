import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/lab/bits";
import { RoleCards, ScenarioView } from "@/components/lab/ScenarioView";
import { LTE_PACKETS } from "@/lib/trace-data";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/lte")({
  head: () => meta("LTE / EPC Attach", "Simplified LTE attach with default EPS bearer: S1AP, NAS EMM/ESM, Diameter S6a, GTPv2-C and GTP-U."),
  component: Page,
});

function Page() {
  return (
    <>
      <PageHeader eyebrow="Scenario · LTE / EPC" title="Attach + default EPS bearer">
        A simplified teaching sequence. RRC signaling on the radio side, some optional messages (e.g. ESM information, UE capability, EIR checks) and
        exact IE sets are omitted. Use it to learn the order and purpose of messages, not as a reference capture.{" "}
        <Link to="/explorer" search={{ scenario: "lte" }} className="text-primary hover:underline">Open in Trace Explorer →</Link>
      </PageHeader>
      <RoleCards
        roles={[
          { node: "UE", text: "The device. Sends NAS (EMM/ESM) messages that are transparent to the eNodeB." },
          { node: "eNB", text: "E-UTRAN base station. Terminates RRC/radio, relays NAS over S1AP, and terminates S1-U GTP-U toward SGW." },
          { node: "MME", text: "Control plane only: NAS mobility, authentication, security, bearer control via S11. Never carries user data." },
          { node: "HSS", text: "Subscriber database. Supplies auth vectors and subscription (APN, QoS) over Diameter S6a." },
          { node: "SGW", text: "User-plane anchor for mobility; terminates S1-U and S5 tunnels and S11 control." },
          { node: "PGW", text: "Gateway to the PDN (SGi). Allocates UE IP, enforces policy/charging on the bearer." },
        ]}
      />
      <ScenarioView scenario="lte" packets={LTE_PACKETS} />
    </>
  );
}
