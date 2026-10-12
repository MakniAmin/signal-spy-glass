// Hand-authored TEACHING traces. Not real captures, not standards-validated.
// All addresses use RFC 5737 documentation ranges; identifiers use test PLMN 001/01.

export type Scenario = "lte" | "5gsa" | "imported";
export type Plane = "control" | "user";

export interface DecodeNode {
  label: string;
  value?: string;
  children?: DecodeNode[];
}

export interface Packet {
  id: string;
  no: number;
  time: number;
  src: string;
  dst: string;
  srcNode: string;
  dstNode: string;
  protocol: string;
  length: number;
  info: string;
  scenario: Scenario;
  step: string;
  iface: string;
  plane: Plane;
  explain: string;
  tree: DecodeNode[];
  demo: boolean;
}

type FieldObj = { [k: string]: string | number | FieldObj };

export function toTree(obj: FieldObj): DecodeNode[] {
  return Object.entries(obj).map(([label, v]) =>
    typeof v === "object" ? { label, children: toTree(v) } : { label, value: String(v) },
  );
}

export const NODES: Record<string, { ip: string; role: string }> = {
  UE: { ip: "10.45.0.7 (UE PDN/PDU addr)", role: "User Equipment" },
  eNB: { ip: "192.0.2.10", role: "LTE base station (E-UTRAN)" },
  MME: { ip: "192.0.2.20", role: "EPC control-plane mobility & session signaling" },
  HSS: { ip: "192.0.2.25", role: "Subscriber database (S6a)" },
  SGW: { ip: "192.0.2.30", role: "Serving Gateway (S1-U/S11/S5)" },
  PGW: { ip: "192.0.2.40", role: "PDN Gateway (S5/SGi, IP allocation)" },
  gNB: { ip: "198.51.100.10", role: "5G NR base station" },
  AMF: { ip: "198.51.100.20", role: "Access & Mobility Management (N1/N2)" },
  AUSF: { ip: "198.51.100.25", role: "Authentication Server Function" },
  UDM: { ip: "198.51.100.26", role: "Unified Data Management" },
  SMF: { ip: "198.51.100.30", role: "Session Management Function (N4 PFCP)" },
  UPF: { ip: "198.51.100.40", role: "User Plane Function (N3/N6)" },
  DN: { ip: "203.0.113.53", role: "Data network test host" },
};

const transport: Record<string, { l4: string; port: number }> = {
  S1AP: { l4: "SCTP", port: 36412 },
  NGAP: { l4: "SCTP", port: 38412 },
  "GTPv2-C": { l4: "UDP", port: 2123 },
  "GTP-U": { l4: "UDP", port: 2152 },
  PFCP: { l4: "UDP", port: 8805 },
  Diameter: { l4: "SCTP", port: 3868 },
  "HTTP/2": { l4: "TCP", port: 7777 },
};

interface Raw {
  t: number;
  s: string;
  d: string;
  proto: string;
  info: string;
  step: string;
  iface: string;
  plane?: Plane;
  explain: string;
  fields: FieldObj;
}

function build(scenario: Scenario, raws: Raw[]): Packet[] {
  return raws.map((r, i) => {
    const tp = transport[r.proto] ?? { l4: "UDP", port: 0 };
    const srcIp = NODES[r.s].ip.split(" ")[0];
    const dstIp = NODES[r.d].ip.split(" ")[0];
    const length = 90 + ((JSON.stringify(r.fields).length * 7) % 260);
    const tree: DecodeNode[] = [
      { label: `Frame ${i + 1}`, value: `${length} bytes (illustrative)`, children: toTree({ "Relative time": `${r.t.toFixed(6)} s`, Interface: r.iface, Plane: r.plane ?? "control" }) },
      { label: "Internet Protocol Version 4", value: `${srcIp} → ${dstIp}`, children: toTree({ Source: srcIp, Destination: dstIp }) },
      { label: tp.l4 === "SCTP" ? "Stream Control Transmission Protocol" : tp.l4 === "TCP" ? "Transmission Control Protocol" : "User Datagram Protocol", value: `Dst port ${tp.port}`, children: toTree({ "Destination port": tp.port }) },
      ...toTree({ [r.proto]: r.fields }),
    ];
    return {
      id: `${scenario}-${i + 1}`,
      no: i + 1,
      time: r.t,
      src: srcIp,
      dst: dstIp,
      srcNode: r.s,
      dstNode: r.d,
      protocol: r.proto,
      length,
      info: r.info,
      scenario,
      step: r.step,
      iface: r.iface,
      plane: r.plane ?? "control",
      explain: r.explain,
      tree,
      demo: true,
    };
  });
}

const IMSI = "001010000000001";

const lteRaw: Raw[] = [
  { t: 0, s: "eNB", d: "MME", proto: "S1AP", step: "1. Initial attach", iface: "S1-MME",
    info: "InitialUEMessage, Attach request, PDN connectivity request",
    explain: "The eNodeB forwards the UE's NAS Attach Request (with a piggy-backed ESM PDN Connectivity Request) to the MME inside an S1AP InitialUEMessage. The eNodeB does not interpret NAS; it only relays it.",
    fields: { procedureCode: "id-initialUEMessage (12)", "eNB-UE-S1AP-ID": 1001, "TAI": { PLMN: "001-01", TAC: "0x0001" }, "NAS-PDU (EMM)": { "Message type": "Attach request (0x41)", "EPS attach type": "EPS attach (1)", "EPS mobile identity": `IMSI ${IMSI}`, "ESM container": "PDN connectivity request (0xd0), PDN type IPv4" }, "RRC-Establishment-Cause": "mo-Signalling" } },
  { t: 0.0042, s: "MME", d: "HSS", proto: "Diameter", step: "2. Authentication", iface: "S6a",
    info: "cmd=Authentication-Information Request (318)",
    explain: "The MME asks the HSS for E-UTRAN authentication vectors (RAND, AUTN, XRES, KASME) for this IMSI.",
    fields: { "Command Code": "318 Authentication-Information", Flags: "Request", "Application-Id": "S6a/S6d (16777251)", "User-Name": IMSI, "Visited-PLMN-Id": "001-01", "Requested-EUTRAN-Authentication-Info": { "Number-Of-Requested-Vectors": 1 } } },
  { t: 0.0118, s: "HSS", d: "MME", proto: "Diameter", step: "2. Authentication", iface: "S6a",
    info: "cmd=Authentication-Information Answer (318) Result-Code=DIAMETER_SUCCESS",
    explain: "The HSS returns an authentication vector. Values shown are placeholders, not real keys.",
    fields: { "Command Code": "318 Authentication-Information", Flags: "Answer", "Result-Code": "DIAMETER_SUCCESS (2001)", "E-UTRAN-Vector": { RAND: "<illustrative>", XRES: "<illustrative>", AUTN: "<illustrative>", KASME: "<redacted>" } } },
  { t: 0.0131, s: "MME", d: "eNB", proto: "S1AP", step: "2. Authentication", iface: "S1-MME",
    info: "DownlinkNASTransport, Authentication request",
    explain: "The MME challenges the UE (EPS-AKA) via a NAS Authentication Request, carried over S1AP.",
    fields: { procedureCode: "id-downlinkNASTransport (11)", "MME-UE-S1AP-ID": 5001, "eNB-UE-S1AP-ID": 1001, "NAS-PDU (EMM)": { "Message type": "Authentication request (0x52)", "NAS key set identifier": 0, RAND: "<illustrative>", AUTN: "<illustrative>" } } },
  { t: 0.0614, s: "eNB", d: "MME", proto: "S1AP", step: "2. Authentication", iface: "S1-MME",
    info: "UplinkNASTransport, Authentication response",
    explain: "The UE answers with RES. The MME compares it to XRES to authenticate the subscriber.",
    fields: { procedureCode: "id-uplinkNASTransport (13)", "MME-UE-S1AP-ID": 5001, "NAS-PDU (EMM)": { "Message type": "Authentication response (0x53)", RES: "<illustrative>" } } },
  { t: 0.0632, s: "MME", d: "eNB", proto: "S1AP", step: "3. NAS security", iface: "S1-MME",
    info: "DownlinkNASTransport, Security mode command",
    explain: "The MME selects NAS ciphering/integrity algorithms. Subsequent NAS messages are integrity protected.",
    fields: { "NAS-PDU (EMM)": { "Security header type": "Integrity protected with new EPS security context (3)", "Message type": "Security mode command (0x5d)", "Selected algorithms": "EEA0 / EIA2 (lab example)" } } },
  { t: 0.0891, s: "eNB", d: "MME", proto: "S1AP", step: "3. NAS security", iface: "S1-MME",
    info: "UplinkNASTransport, Security mode complete",
    explain: "The UE confirms the NAS security context.",
    fields: { "NAS-PDU (EMM)": { "Security header type": "Integrity protected and ciphered with new EPS security context (4)", "Message type": "Security mode complete (0x5e)" } } },
  { t: 0.0905, s: "MME", d: "HSS", proto: "Diameter", step: "4. Location update", iface: "S6a",
    info: "cmd=Update-Location Request (316)",
    explain: "The MME registers itself as serving MME and fetches the subscription profile (APN config, AMBR).",
    fields: { "Command Code": "316 Update-Location", Flags: "Request", "User-Name": IMSI, "RAT-Type": "EUTRAN (1004)", "ULR-Flags": "0x00000022" } },
  { t: 0.0977, s: "HSS", d: "MME", proto: "Diameter", step: "4. Location update", iface: "S6a",
    info: "cmd=Update-Location Answer (316) Result-Code=DIAMETER_SUCCESS",
    explain: "Subscription data is returned, including the default APN 'internet' and its QoS profile.",
    fields: { "Command Code": "316 Update-Location", "Result-Code": "DIAMETER_SUCCESS (2001)", "Subscription-Data": { "APN-Configuration": { "Service-Selection": "internet", "PDN-Type": "IPv4", "QoS-Class-Identifier": 9 } } } },
  { t: 0.0991, s: "MME", d: "SGW", proto: "GTPv2-C", step: "5. Default bearer setup", iface: "S11",
    info: "Create Session Request",
    explain: "The MME asks the SGW to create a session for the default EPS bearer (EBI 5). It includes the PGW S5/S8 address to use.",
    fields: { "Message Type": "Create Session Request (32)", TEID: "0x00000000", "Sequence Number": "0x000101", IMSI, APN: "internet", "RAT Type": "EUTRAN (6)", "Sender F-TEID (S11 MME)": "TEID 0x0000a001, 192.0.2.20", "PGW S5/S8 Address": "192.0.2.40", "Bearer Context": { EBI: 5, "Bearer QoS": "QCI 9, ARP 8" } } },
  { t: 0.1012, s: "SGW", d: "PGW", proto: "GTPv2-C", step: "5. Default bearer setup", iface: "S5",
    info: "Create Session Request",
    explain: "The SGW relays session creation to the PGW over S5, providing its own S5 control and user-plane F-TEIDs.",
    fields: { "Message Type": "Create Session Request (32)", "Sequence Number": "0x000201", "Sender F-TEID (S5/S8 SGW GTP-C)": "TEID 0x0000b001, 192.0.2.30", "Bearer Context": { EBI: 5, "S5/S8-U SGW F-TEID": "TEID 0x0000b101, 192.0.2.30" } } },
  { t: 0.1077, s: "PGW", d: "SGW", proto: "GTPv2-C", step: "5. Default bearer setup", iface: "S5",
    info: "Create Session Response, Cause: Request accepted",
    explain: "The PGW allocates the UE IP address (PAA) and accepts the bearer.",
    fields: { "Message Type": "Create Session Response (33)", TEID: "0x0000b001", "Sequence Number": "0x000201", Cause: "Request accepted (16)", PAA: "IPv4 10.45.0.7", "Bearer Context": { EBI: 5, Cause: "Request accepted (16)", "S5/S8-U PGW F-TEID": "TEID 0x0000c101, 192.0.2.40" } } },
  { t: 0.1094, s: "SGW", d: "MME", proto: "GTPv2-C", step: "5. Default bearer setup", iface: "S11",
    info: "Create Session Response, Cause: Request accepted",
    explain: "The SGW returns the S1-U uplink F-TEID the eNodeB must send user data to.",
    fields: { "Message Type": "Create Session Response (33)", TEID: "0x0000a001", Cause: "Request accepted (16)", PAA: "IPv4 10.45.0.7", "Bearer Context": { EBI: 5, "S1-U SGW F-TEID": "TEID 0x0000d101, 192.0.2.30" } } },
  { t: 0.1108, s: "MME", d: "eNB", proto: "S1AP", step: "6. Context setup & Attach Accept", iface: "S1-MME",
    info: "InitialContextSetupRequest, Attach accept, Activate default EPS bearer context request",
    explain: "The MME sets up the UE context and E-RAB on the eNodeB, and sends Attach Accept with the default bearer activation (ESM) to the UE.",
    fields: { procedureCode: "id-InitialContextSetup (9)", "E-RABToBeSetupListCtxtSUReq": { "e-RAB-ID": 5, "transportLayerAddress": "192.0.2.30", "gTP-TEID": "0x0000d101", QCI: 9 }, "NAS-PDU (EMM)": { "Message type": "Attach accept (0x42)", GUTI: "001-01-0001-01-0xC0000001", "ESM container": "Activate default EPS bearer context request (0xc1), APN internet, PDN addr 10.45.0.7" } } },
  { t: 0.1456, s: "eNB", d: "MME", proto: "S1AP", step: "6. Context setup & Attach Accept", iface: "S1-MME",
    info: "InitialContextSetupResponse",
    explain: "The eNodeB confirms the E-RAB and gives its own S1-U downlink F-TEID.",
    fields: { procedureCode: "id-InitialContextSetup (9)", "E-RABSetupListCtxtSURes": { "e-RAB-ID": 5, transportLayerAddress: "192.0.2.10", "gTP-TEID": "0x00e00105" } } },
  { t: 0.1712, s: "eNB", d: "MME", proto: "S1AP", step: "7. Attach complete", iface: "S1-MME",
    info: "UplinkNASTransport, Attach complete, Activate default EPS bearer context accept",
    explain: "The UE completes attach and accepts the default bearer.",
    fields: { "NAS-PDU (EMM)": { "Message type": "Attach complete (0x43)", "ESM container": "Activate default EPS bearer context accept (0xc2)" } } },
  { t: 0.1725, s: "MME", d: "SGW", proto: "GTPv2-C", step: "7. Attach complete", iface: "S11",
    info: "Modify Bearer Request",
    explain: "The MME tells the SGW the eNodeB's downlink S1-U F-TEID so downlink data can flow.",
    fields: { "Message Type": "Modify Bearer Request (34)", "Bearer Context": { EBI: 5, "S1-U eNodeB F-TEID": "TEID 0x00e00105, 192.0.2.10" } } },
  { t: 0.1748, s: "SGW", d: "MME", proto: "GTPv2-C", step: "7. Attach complete", iface: "S11",
    info: "Modify Bearer Response, Cause: Request accepted",
    explain: "The default bearer is now complete end to end.",
    fields: { "Message Type": "Modify Bearer Response (35)", Cause: "Request accepted (16)" } },
  { t: 0.5021, s: "eNB", d: "SGW", proto: "GTP-U", step: "8. User-plane check", iface: "S1-U", plane: "user",
    info: "T-PDU, ICMP Echo request 10.45.0.7 → 203.0.113.53",
    explain: "User data: the UE's ping, tunnelled in GTP-U toward the SGW using the SGW's S1-U TEID.",
    fields: { Flags: "0x30", "Message Type": "T-PDU (255)", TEID: "0x0000d101", "Inner IPv4": { Source: "10.45.0.7", Destination: "203.0.113.53", ICMP: "Echo (ping) request, id=0x0001 seq=1" } } },
  { t: 0.5389, s: "SGW", d: "eNB", proto: "GTP-U", step: "8. User-plane check", iface: "S1-U", plane: "user",
    info: "T-PDU, ICMP Echo reply 203.0.113.53 → 10.45.0.7",
    explain: "Downlink reply tunnelled back to the eNodeB using the eNodeB's TEID from InitialContextSetupResponse.",
    fields: { Flags: "0x30", "Message Type": "T-PDU (255)", TEID: "0x00e00105", "Inner IPv4": { Source: "203.0.113.53", Destination: "10.45.0.7", ICMP: "Echo (ping) reply, id=0x0001 seq=1" } } },
];

const SUPI = "imsi-001010000000002";

const nrRaw: Raw[] = [
  { t: 0, s: "gNB", d: "AMF", proto: "NGAP", step: "1. Registration", iface: "N2 (NAS on N1)",
    info: "InitialUEMessage, Registration request",
    explain: "The gNB forwards the UE's 5GMM Registration Request to the AMF in an NGAP InitialUEMessage. The NAS part is the N1 interface, transported over N2.",
    fields: { procedureCode: "id-InitialUEMessage (15)", "RAN-UE-NGAP-ID": 2001, "UserLocationInformation": { "NR-CGI": "001-01 / 0x000000010", TAI: "001-01 / TAC 0x000001" }, "NAS-PDU (5GMM)": { "Message type": "Registration request (0x41)", "5GS registration type": "initial registration (1)", "5GS mobile identity": "SUCI (null scheme, lab)", "UE security capability": "5G-EA0, 5G-IA2" }, RRCEstablishmentCause: "mo-Signalling" } },
  { t: 0.0039, s: "AMF", d: "AUSF", proto: "HTTP/2", step: "2. Authentication", iface: "SBI (Nausf)",
    info: "POST /nausf-auth/v1/ue-authentications",
    explain: "Service-Based Interface: the AMF (as SEAF) requests UE authentication from the AUSF.",
    fields: { ":method": "POST", ":path": "/nausf-auth/v1/ue-authentications", "content-type": "application/json", Body: { supiOrSuci: "suci-0-001-01-...", servingNetworkName: "5G:mnc001.mcc001.3gppnetwork.org" } } },
  { t: 0.0071, s: "AUSF", d: "UDM", proto: "HTTP/2", step: "2. Authentication", iface: "SBI (Nudm)",
    info: "POST /nudm-ueau/v1/{suci}/security-information/generate-auth-data",
    explain: "The AUSF asks the UDM to de-conceal the SUCI to SUPI and generate a 5G-AKA vector.",
    fields: { ":method": "POST", ":path": "/nudm-ueau/v1/suci-0-001-01-.../security-information/generate-auth-data", Body: { servingNetworkName: "5G:mnc001.mcc001.3gppnetwork.org", ausfInstanceId: "<illustrative-uuid>" } } },
  { t: 0.0142, s: "AMF", d: "gNB", proto: "NGAP", step: "2. Authentication", iface: "N2 (NAS on N1)",
    info: "DownlinkNASTransport, Authentication request",
    explain: "The AMF sends the 5G-AKA challenge to the UE.",
    fields: { procedureCode: "id-DownlinkNASTransport (4)", "AMF-UE-NGAP-ID": 7001, "NAS-PDU (5GMM)": { "Message type": "Authentication request (0x56)", ngKSI: 0, RAND: "<illustrative>", AUTN: "<illustrative>" } } },
  { t: 0.0588, s: "gNB", d: "AMF", proto: "NGAP", step: "2. Authentication", iface: "N2 (NAS on N1)",
    info: "UplinkNASTransport, Authentication response",
    explain: "The UE returns RES*; AMF/AUSF verify it (the AUSF confirmation call is omitted here for brevity).",
    fields: { procedureCode: "id-UplinkNASTransport (46)", "NAS-PDU (5GMM)": { "Message type": "Authentication response (0x57)", "RES*": "<illustrative>" } } },
  { t: 0.0611, s: "AMF", d: "gNB", proto: "NGAP", step: "3. NAS security", iface: "N2 (NAS on N1)",
    info: "DownlinkNASTransport, Security mode command",
    explain: "The AMF activates NAS security between UE and AMF.",
    fields: { "NAS-PDU (5GMM)": { "Message type": "Security mode command (0x5d)", "Selected NAS security algorithms": "5G-EA0 / 5G-IA2 (lab example)" } } },
  { t: 0.0874, s: "gNB", d: "AMF", proto: "NGAP", step: "3. NAS security", iface: "N2 (NAS on N1)",
    info: "UplinkNASTransport, Security mode complete",
    explain: "NAS security is active; the full Registration Request may be re-sent inside this message.",
    fields: { "NAS-PDU (5GMM)": { "Message type": "Security mode complete (0x5e)", "NAS message container": "Registration request (full)" } } },
  { t: 0.0902, s: "AMF", d: "UDM", proto: "HTTP/2", step: "4. UDM registration", iface: "SBI (Nudm)",
    info: "PUT /nudm-uecm/v1/imsi-001010000000002/registrations/amf-3gpp-access",
    explain: "The AMF registers itself in the UDM as serving AMF for this SUPI (subscription data retrieval is omitted).",
    fields: { ":method": "PUT", ":path": `/nudm-uecm/v1/${SUPI}/registrations/amf-3gpp-access`, Body: { amfInstanceId: "<illustrative-uuid>", ratType: "NR" } } },
  { t: 0.0991, s: "AMF", d: "gNB", proto: "NGAP", step: "5. Registration accept", iface: "N2 (NAS on N1)",
    info: "InitialContextSetupRequest, Registration accept",
    explain: "The AMF establishes the UE context in the gNB (AS security key) and accepts registration, assigning a 5G-GUTI.",
    fields: { procedureCode: "id-InitialContextSetup (14)", "GUAMI": "001-01 / AMF Region 0x01 / Set 0x001 / Ptr 0", "NAS-PDU (5GMM)": { "Message type": "Registration accept (0x42)", "5GS registration result": "3GPP access", "5G-GUTI": "001-01-01-001-00-0xC0000002", "Allowed NSSAI": "SST 1" } } },
  { t: 0.1288, s: "gNB", d: "AMF", proto: "NGAP", step: "5. Registration accept", iface: "N2",
    info: "InitialContextSetupResponse",
    explain: "The gNB confirms the UE context.",
    fields: { procedureCode: "id-InitialContextSetup (14)", "AMF-UE-NGAP-ID": 7001, "RAN-UE-NGAP-ID": 2001 } },
  { t: 0.1501, s: "gNB", d: "AMF", proto: "NGAP", step: "5. Registration accept", iface: "N2 (NAS on N1)",
    info: "UplinkNASTransport, Registration complete",
    explain: "The UE acknowledges the 5G-GUTI. The UE is now RM-REGISTERED but has no PDU session yet.",
    fields: { "NAS-PDU (5GMM)": { "Message type": "Registration complete (0x43)" } } },
  { t: 0.3102, s: "gNB", d: "AMF", proto: "NGAP", step: "6. PDU session request", iface: "N2 (NAS on N1)",
    info: "UplinkNASTransport, UL NAS transport, PDU session establishment request",
    explain: "The UE requests a PDU session. The 5GSM message is carried inside a 5GMM UL NAS Transport; the AMF routes it to an SMF selected by DNN/S-NSSAI.",
    fields: { "NAS-PDU (5GMM)": { "Message type": "UL NAS transport (0x67)", "Payload container type": "N1 SM information (1)", "PDU session ID": 1, DNN: "internet", "S-NSSAI": "SST 1", "Payload (5GSM)": { "Message type": "PDU session establishment request (0xc1)", "PDU session type": "IPv4", "SSC mode": 1 } } } },
  { t: 0.3131, s: "AMF", d: "SMF", proto: "HTTP/2", step: "6. PDU session request", iface: "SBI (Nsmf)",
    info: "POST /nsmf-pdusession/v1/sm-contexts",
    explain: "The AMF creates an SM context in the SMF and hands over the N1 SM container.",
    fields: { ":method": "POST", ":path": "/nsmf-pdusession/v1/sm-contexts", Body: { supi: SUPI, pduSessionId: 1, dnn: "internet", sNssai: "{ sst: 1 }", n1SmMsg: "<binary part>" } } },
  { t: 0.3214, s: "SMF", d: "UPF", proto: "PFCP", step: "7. N4 session setup", iface: "N4",
    info: "PFCP Session Establishment Request",
    explain: "The SMF programs the UPF over N4: detection rules (PDR), forwarding (FAR) and QoS enforcement (QER). The UPF does not see NAS.",
    fields: { "Message Type": "Session Establishment Request (50)", "S flag": "1 (SEID present)", SEID: "0x0000000000000000 (no UP SEID known yet)", "Sequence Number": 1201, "Node ID": "IPv4 198.51.100.30", "F-SEID (CP)": "SEID 0x0000000000000a01, 198.51.100.30", "Create PDR (uplink)": { "PDR ID": 1, Precedence: 255, PDI: "Source Interface Access, F-TEID CHOOSE", "FAR ID": 1 }, "Create PDR (downlink)": { "PDR ID": 2, PDI: "Source Interface Core, UE IP 10.45.0.7", "FAR ID": 2 }, "Create FAR 1": "Apply Action FORW → Destination Core", "Create FAR 2": "Apply Action BUFF (gNB TEID not yet known)", "Create QER": "QER ID 1, Gate OPEN/OPEN, MBR UL/DL illustrative" } },
  { t: 0.3239, s: "UPF", d: "SMF", proto: "PFCP", step: "7. N4 session setup", iface: "N4",
    info: "PFCP Session Establishment Response, Cause: Request accepted",
    explain: "The UPF accepts, returns its own F-SEID and the allocated N3 uplink F-TEID.",
    fields: { "Message Type": "Session Establishment Response (51)", SEID: "0x0000000000000a01 (SMF's CP SEID)", "Sequence Number": 1201, Cause: "Request accepted (1)", "Node ID": "IPv4 198.51.100.40", "F-SEID (UP)": "SEID 0x0000000000000b01, 198.51.100.40", "Created PDR": { "PDR ID": 1, "Local F-TEID": "TEID 0x00000101, 198.51.100.40" } } },
  { t: 0.3262, s: "SMF", d: "AMF", proto: "HTTP/2", step: "8. Resource setup", iface: "SBI (Namf)",
    info: "POST /namf-comm/v1/ue-contexts/{supi}/n1-n2-messages",
    explain: "The SMF asks the AMF to deliver the N2 SM info (UPF TEID, QoS) to the gNB and the N1 PDU Session Establishment Accept to the UE.",
    fields: { ":method": "POST", ":path": `/namf-comm/v1/ue-contexts/${SUPI}/n1-n2-messages`, Body: { n1MessageClass: "SM", n2InfoClass: "SM", pduSessionId: 1 } } },
  { t: 0.3291, s: "AMF", d: "gNB", proto: "NGAP", step: "8. Resource setup", iface: "N2 (NAS on N1)",
    info: "PDUSessionResourceSetupRequest, DL NAS transport, PDU session establishment accept",
    explain: "The gNB receives the UPF's N3 uplink TEID and QoS flow (QFI). The UE receives its IP address in the 5GSM Accept.",
    fields: { procedureCode: "id-PDUSessionResourceSetup (29)", "PDUSessionResourceSetupListSUReq": { "pDUSessionID": 1, "UL-NGU-UP-TNLInformation": "198.51.100.40 / TEID 0x00000101", "QosFlowSetupRequestList": "QFI 1, 5QI 9" }, "NAS-PDU (5GSM)": { "Message type": "PDU session establishment accept (0xc2)", "PDU address": "IPv4 10.45.0.7", "Authorized QoS rules": "QFI 1 default rule" } } },
  { t: 0.3577, s: "gNB", d: "AMF", proto: "NGAP", step: "8. Resource setup", iface: "N2",
    info: "PDUSessionResourceSetupResponse",
    explain: "The gNB returns its downlink N3 TEID, which must reach the UPF.",
    fields: { procedureCode: "id-PDUSessionResourceSetup (29)", "DL-NGU-UP-TNLInformation": "198.51.100.10 / TEID 0x00f00001", "AssociatedQosFlowList": "QFI 1" } },
  { t: 0.3592, s: "AMF", d: "SMF", proto: "HTTP/2", step: "9. N4 update", iface: "SBI (Nsmf)",
    info: "POST /nsmf-pdusession/v1/sm-contexts/{ref}/modify",
    explain: "The AMF forwards the gNB's N2 SM info (downlink TEID) to the SMF.",
    fields: { ":method": "POST", ":path": "/nsmf-pdusession/v1/sm-contexts/<ref>/modify", Body: { n2SmInfoType: "PDU_RES_SETUP_RSP" } } },
  { t: 0.3611, s: "SMF", d: "UPF", proto: "PFCP", step: "9. N4 update", iface: "N4",
    info: "PFCP Session Modification Request",
    explain: "The SMF updates FAR 2 from BUFF to FORW with Outer Header Creation toward the gNB TEID.",
    fields: { "Message Type": "Session Modification Request (52)", SEID: "0x0000000000000b01 (UPF's UP SEID)", "Sequence Number": 1202, "Update FAR": { "FAR ID": 2, "Apply Action": "FORW", "Outer Header Creation": "GTP-U/UDP/IPv4, TEID 0x00f00001, 198.51.100.10" } } },
  { t: 0.3630, s: "UPF", d: "SMF", proto: "PFCP", step: "9. N4 update", iface: "N4",
    info: "PFCP Session Modification Response, Cause: Request accepted",
    explain: "Downlink forwarding is now active.",
    fields: { "Message Type": "Session Modification Response (53)", SEID: "0x0000000000000a01", "Sequence Number": 1202, Cause: "Request accepted (1)" } },
  { t: 0.7004, s: "gNB", d: "UPF", proto: "GTP-U", step: "10. User-plane check", iface: "N3", plane: "user",
    info: "T-PDU, QFI 1, ICMP Echo request 10.45.0.7 → 203.0.113.53",
    explain: "User plane on N3: the UE's ping encapsulated in GTP-U with a PDU Session Container extension header carrying the QFI.",
    fields: { Flags: "0x34 (E flag)", "Message Type": "T-PDU (255)", TEID: "0x00000101", "PDU Session Container": "UL PDU SESSION INFORMATION, QFI 1", "Inner IPv4": { Source: "10.45.0.7", Destination: "203.0.113.53", ICMP: "Echo (ping) request, seq=1" } } },
  { t: 0.7312, s: "UPF", d: "gNB", proto: "GTP-U", step: "10. User-plane check", iface: "N3", plane: "user",
    info: "T-PDU, QFI 1, ICMP Echo reply 203.0.113.53 → 10.45.0.7",
    explain: "Downlink reply returned via N6 → UPF → N3 using the gNB TEID programmed in FAR 2.",
    fields: { Flags: "0x34 (E flag)", "Message Type": "T-PDU (255)", TEID: "0x00f00001", "PDU Session Container": "DL PDU SESSION INFORMATION, QFI 1", "Inner IPv4": { Source: "203.0.113.53", Destination: "10.45.0.7", ICMP: "Echo (ping) reply, seq=1" } } },
];

export const LTE_PACKETS = build("lte", lteRaw);
export const NR_PACKETS = build("5gsa", nrRaw);
export const DEMO_PACKETS = [...LTE_PACKETS, ...NR_PACKETS];

export const SCENARIO_LABEL: Record<Scenario, string> = {
  lte: "LTE / EPC Attach",
  "5gsa": "5G SA Registration + PDU Session",
  imported: "Imported trace",
};

export const SCENARIO_NODES: Record<"lte" | "5gsa", string[]> = {
  lte: ["eNB", "MME", "HSS", "SGW", "PGW"],
  "5gsa": ["gNB", "AMF", "AUSF", "UDM", "SMF", "UPF"],
};
