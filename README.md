# Signal Spy Glass

Build a portfolio-quality project called "LTE/5G Signaling Analysis Lab" for a junior Network & Communications Engineer targeting Core Network / Telecom jobs. This is a protocol-learning and trace-analysis workbench, not a live telecom network and not a replacement for Wireshark. Use accurate terminology and clearly distinguish LTE/EPC procedures from 5G Standalone procedures.

Visual direction: professional telecom/NOC analysis tool, dark navy/slate, subtle cyan/blue accents, high readability, responsive desktop-first layout. Avoid a marketing landing page; make the actual lab interface the main experience.

Core sections:
1. Overview / Lab Guide: explain goals, supported protocols and demo-data status; quick links to LTE and 5G SA trace scenarios; show a visible "SAMPLE TRACE / DEMO DATA" badge anywhere seeded data appears.
2. Trace Explorer: a Wireshark-inspired packet table with No., relative time, source, destination, protocol, length, info; search box; protocol and scenario filters; selectable row opens detailed decoded fields. Keep all IPs/IDs fictional/documentation-only.
3. LTE/EPC scenario: sample teaching trace for a simplified attach/default bearer procedure with appropriately chosen LTE/EPC concepts (e.g. NAS Attach Request/Accept, S1AP, GTP-C, DNS/ICMP only if relevant). Do not pretend a short hand-authored table is a complete standards-valid capture. Explain roles of UE, eNodeB, MME, SGW, PGW.
4. 5G SA scenario: sample teaching trace showing registration and PDU session establishment with 5G concepts (NAS Registration Request/Accept, NGAP, PFCP Session Establishment Request/Response, GTP-U only for user-plane example). Explain UE, gNB, AMF, SMF, UPF, AUSF/UDM. Distinguish N1/N2/N3/N4 and control/user planes accurately.
5. PFCP Analysis: dedicated decoder-style panel for a sample PFCP Session Establishment Request. Include message type, SEID presence/meaning, sequence number, and sample information elements such as Node ID, F-SEID, Create PDR, Create FAR, Create QER when appropriate. Mark all field values as illustrative and explain that exact field presence depends on actual packet. Do not fabricate claims about protocol conformance.
6. Procedure Timeline: visual sequence of messages grouped by steps with direction arrows, endpoint names, protocol, and plain-language meaning. Selecting a message syncs with packet detail.
7. Troubleshooting: scenarios for registration failure, PDU session failure, PFCP rejection, GTP-U/user-plane connectivity, and LTE attach/default bearer issues. Each includes symptom, ordered diagnostic steps, what to inspect in Wireshark, example safe lab commands/log clues, likely causes, and verification.
8. Learning Notes / Glossary: concise glossary and comparisons between LTE EPC and 5G Core; avoid conflating MME with AMF or SGW/PGW with UPF.
9. Import Trace: allow importing a local JSON file containing normalized packet records if feasible; validate shape and show errors. If PCAP upload parsing is not supported, explicitly say PCAP/PCAPNG decoding should be done in Wireshark/tshark and the user can export/normalize fields to JSON. Do not claim to parse real PCAP files unless implemented.
10. README / Architecture: explain project purpose, limitations, sample vs real data, how to capture lab traffic with Wireshark/tshark and bring normalized records into this workbench, plus project setup.

Functional requirements:
- Seed believable but fictional educational traces for LTE and 5G SA; every sample is clearly labeled as demo data.
- Working scenario selection, search, protocol filtering, row selection/detail pane, timeline synchronization, glossary search, troubleshooting navigation, and reset-to-demo behavior.
- Provide packet fields in structured decode-tree style, and a concise plain-language explanation per selected packet.
- Use reusable components, responsive layout, keyboard-friendly controls, empty/error states.
- No external paid dependencies, no API keys/secrets, no claims of live network connectivity or actual standards validation.
- Focus on a coherent and polished first version; implement functioning interactions rather than static screenshots.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f9746f91-47a7-40e2-9333-98cae406f670).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
