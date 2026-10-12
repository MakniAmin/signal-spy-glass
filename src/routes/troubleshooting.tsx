import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/lab/bits";
import { cn } from "@/lib/utils";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/troubleshooting")({
  head: () => meta("Troubleshooting", "Structured diagnostic playbooks for 5G registration, PDU session, PFCP, GTP-U and LTE attach failures."),
  component: Page,
});

interface Case { id: string; gen: string; title: string; symptom: string; steps: string[]; wireshark: string[]; commands: string[]; causes: string[]; verify: string }

const CASES: Case[] = [
  { id: "reg", gen: "5G SA", title: "Registration failure", symptom: "UE never reaches RM-REGISTERED; UE log shows Registration Reject or repeated attempts.",
    steps: ["Confirm NGAP N2 is up (NG Setup Request/Response between gNB and AMF).", "Find InitialUEMessage and the AMF's reply. Is there a Registration Reject? Note the 5GMM cause.", "Check the authentication exchange (AMF↔AUSF↔UDM SBI responses: HTTP status codes).", "Check Security Mode Command/Complete or Reject.", "Check PLMN/TAC/S-NSSAI configuration consistency between gNB, AMF and subscriber."],
    wireshark: ["ngap", "nas-5gs.mm.message_type == 0x44 (Registration reject)", "nas-5gs.mm.5gmm_cause", "http2.headers.status >= 400"],
    commands: ["tshark -r lab.pcapng -Y 'ngap' -T fields -e frame.number -e _ws.col.Info", "journalctl -u <amf-service> --since '10 min ago' | grep -i 'reject\\|cause'", "Log clue: 'Cannot find SUCI' / 'PLMN not served' / 'Authentication failure'"],
    causes: ["Subscriber not provisioned / wrong key or OPc in UDM/UDR", "PLMN or TAC mismatch", "Requested S-NSSAI not allowed", "NG Setup failed (AMF not reachable over SCTP 38412)"],
    verify: "Registration Accept followed by Registration Complete; UE reports registered state." },
  { id: "pdu", gen: "5G SA", title: "PDU session establishment failure", symptom: "UE registered but no IP address; PDU Session Establishment Reject seen.",
    steps: ["Locate UL NAS Transport with PDU Session Establishment Request; note DNN and S-NSSAI.", "Check AMF→SMF Nsmf CreateSMContext response code.", "Check N4: was a PFCP Session Establishment sent and accepted?", "Check N1N2MessageTransfer and NGAP PDUSessionResourceSetupResponse/Failure.", "Read the 5GSM cause in any Reject."],
    wireshark: ["nas-5gs.sm.message_type == 0xc3 (PDU session establishment reject)", "nas-5gs.sm.5gsm_cause", "http2 && http2.headers.path contains \"sm-contexts\"", "ngap.procedureCode == 29"],
    commands: ["tshark -r lab.pcapng -Y 'nas-5gs.sm.5gsm_cause' -T fields -e nas-5gs.sm.5gsm_cause", "Log clue: 'DNN not supported' / 'No UPF selected' / 'IP pool exhausted'"],
    causes: ["DNN not configured on SMF or not in subscription", "No PFCP association to a suitable UPF", "UE IP pool exhausted", "gNB rejects resource setup (QoS unsupported)"],
    verify: "PDU Session Establishment Accept containing a PDU address; PFCP Modification with gNB F-TEID accepted." },
  { id: "pfcp", gen: "5G SA", title: "PFCP rejection", symptom: "SMF logs PFCP error; Session Establishment Response with Cause ≠ Request accepted, or no response at all.",
    steps: ["Verify PFCP Association Setup Request/Response exist and succeeded.", "Check Heartbeat Request/Response — is the peer alive?", "Read Cause and Offending IE in the response.", "Compare Node ID in request with the association.", "Check UDP 8805 reachability between SMF and UPF addresses."],
    wireshark: ["pfcp", "pfcp.msg_type == 51 && pfcp.cause != 1", "pfcp.offending_ie", "pfcp.msg_type == 5 || pfcp.msg_type == 6 (Association Setup)"],
    commands: ["tshark -i <lab-iface> -f 'udp port 8805' -w n4.pcapng", "ss -uan | grep 8805", "Log clue: 'No established PFCP Association' / 'Mandatory IE missing' / 'Rule creation/modification failure'"],
    causes: ["No PFCP association (wrong UPF address in SMF config)", "Unsupported or malformed IE (version mismatch between implementations)", "UPF resource limits", "Firewall blocking UDP 8805"],
    verify: "Session Establishment Response Cause = Request accepted (1) with UP F-SEID and created PDR F-TEID." },
  { id: "gtpu", gen: "Both", title: "GTP-U / user-plane connectivity", symptom: "Session is up (UE has IP) but ping/HTTP fails.",
    steps: ["Capture on N3/S1-U and on N6/SGi simultaneously.", "Uplink: is the UE packet present inside GTP-U with the expected TEID? Does it exit on N6?", "Downlink: does the reply arrive on N6 and is it re-encapsulated with the gNB/eNB TEID?", "Check TEIDs against signaling (PFCP F-TEID / Outer Header Creation, or S1-U F-TEIDs).", "Check MTU — GTP-U adds ~36+ bytes; look for fragmentation or drops of large packets.", "Check NAT/routing on the N6 side for the UE IP pool."],
    wireshark: ["gtp", "gtp.teid == 0x00000101", "gtp && icmp", "ip.addr == 10.45.0.7"],
    commands: ["ping -c 3 -I <ue-tun> 203.0.113.53", "ip route get 203.0.113.53", "tshark -i <n3-iface> -Y 'gtp' -T fields -e gtp.teid -e ip.src -e ip.dst", "Log clue: 'No PDR matched' / 'Unknown TEID' / ICMP 'Fragmentation needed'"],
    causes: ["TEID mismatch (FAR still BUFF, missing Session Modification)", "Missing route/NAT for UE pool on N6/SGi", "MTU/fragmentation issues", "QER gate closed"],
    verify: "Echo request and reply visible on both N3 (encapsulated) and N6 (plain IP) with matching TEIDs." },
  { id: "lte", gen: "LTE", title: "LTE attach / default bearer issue", symptom: "UE gets Attach Reject or no IP; MME logs Create Session failures.",
    steps: ["Confirm S1 Setup between eNB and MME.", "Check Attach Request → Authentication → Security Mode flow over S1AP.", "Check Diameter S6a AIA/ULA Result-Code / Experimental-Result.", "Check GTPv2-C Create Session Request/Response on S11 and S5; read the Cause.", "Check InitialContextSetupResponse vs. Failure and the following Modify Bearer."],
    wireshark: ["s1ap", "nas-eps.nas_msg_emm_type == 0x44 (Attach reject)", "diameter.Result-Code != 2001", "gtpv2.cause != 16"],
    commands: ["tshark -r lte.pcapng -Y 'gtpv2' -T fields -e gtpv2.message_type -e gtpv2.cause", "Log clue: 'Unknown APN' / 'User unknown' (DIAMETER_ERROR_USER_UNKNOWN 5001) / 'No resources available'"],
    causes: ["IMSI not provisioned in HSS", "APN mismatch between UE, HSS and PGW", "SGW/PGW unreachable on GTP-C 2123", "PGW IP pool exhausted"],
    verify: "Attach Accept + Activate Default EPS Bearer Context Request, Attach Complete, Modify Bearer Response accepted, GTP-U ping succeeds." },
];

const Sect = ({ t, items, mono }: { t: string; items: string[]; mono?: boolean }) => (
  <div>
    <h3 className="eyebrow mb-1">{t}</h3>
    <ul className={cn("space-y-1 text-sm", mono && "font-mono text-xs")}>
      {items.map((i) => <li key={i} className={mono ? "rounded bg-background/60 px-2 py-1 text-primary" : ""}>{mono ? i : `• ${i}`}</li>)}
    </ul>
  </div>
);

function Page() {
  const [id, setId] = useState(CASES[0].id);
  const c = CASES.find((x) => x.id === id)!;
  return (
    <>
      <PageHeader eyebrow="Troubleshooting" title="Diagnostic playbooks" badge={false}>
        Lab-safe procedures for your own test network. Commands are generic examples; adapt interface and service names to your setup. Never capture on networks you are not authorised to analyse.
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <nav className="panel h-fit p-1" aria-label="Scenarios">
          {CASES.map((x) => (
            <button key={x.id} onClick={() => setId(x.id)} aria-current={x.id === id}
              className={cn("flex w-full flex-col items-start rounded px-3 py-2 text-left text-sm hover:bg-accent", x.id === id && "bg-accent")}>
              <span className="font-mono text-[10px] text-muted-foreground">{x.gen}</span>{x.title}
            </button>
          ))}
        </nav>
        <article className="panel space-y-5 p-5">
          <div>
            <span className="font-mono text-xs text-muted-foreground">{c.gen}</span>
            <h2 className="text-xl font-semibold">{c.title}</h2>
            <p className="mt-2 rounded border-l-2 border-warn bg-warn/10 px-3 py-2 text-sm"><strong>Symptom:</strong> {c.symptom}</p>
          </div>
          <div>
            <h3 className="eyebrow mb-1">Ordered diagnostic steps</h3>
            <ol className="list-decimal space-y-1 pl-5 text-sm">{c.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <Sect t="Wireshark display filters" items={c.wireshark} mono />
            <Sect t="Lab commands / log clues" items={c.commands} mono />
          </div>
          <Sect t="Likely causes" items={c.causes} />
          <p className="rounded border-l-2 border-ok bg-ok/10 px-3 py-2 text-sm"><strong>Verification:</strong> {c.verify}</p>
          <p className="text-xs text-muted-foreground">Filter field names follow current Wireshark dissectors but may vary between versions.</p>
        </article>
      </div>
    </>
  );
}
