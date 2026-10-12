import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/lab/bits";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/architecture")({
  head: () => meta("README & Architecture", "Project purpose, limitations, sample vs real data, capture workflow with Wireshark/tshark and setup."),
  component: Page,
});

const S = ({ t, children }: { t: string; children: ReactNode }) => (
  <section className="panel p-4">
    <h2 className="eyebrow mb-2">{t}</h2>
    <div className="space-y-2 text-sm">{children}</div>
  </section>
);
const Code = ({ children }: { children: string }) => <pre className="overflow-x-auto rounded bg-background/60 p-3 font-mono text-xs text-primary">{children}</pre>;

function Page() {
  return (
    <>
      <PageHeader eyebrow="README / Architecture" title="About this project" badge={false}>
        A portfolio project demonstrating LTE/EPC and 5G SA signaling knowledge through an interactive analysis workbench.
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-2">
        <S t="Purpose">
          <p>Practise reading control-plane and user-plane traces, understand which network function sends what and why, and rehearse structured troubleshooting.</p>
        </S>
        <S t="Limitations">
          <ul className="list-disc space-y-1 pl-5">
            <li>No live network connectivity; no packets are sent or captured.</li>
            <li>No PCAP/PCAPNG decoding — use Wireshark/tshark.</li>
            <li>No standards conformance validation. Sample traces are simplified and hand-authored.</li>
          </ul>
        </S>
        <S t="Sample vs real data">
          <p>Seeded records carry a <span className="font-mono text-warn">SAMPLE TRACE / DEMO DATA</span> badge. Imported records are labelled as user data and stored only in local browser storage; "Reset to demo data" clears them.</p>
          <p>Addresses use RFC 5737 ranges (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24); identities use test PLMN 001/01.</p>
        </S>
        <S t="Capturing lab traffic">
          <p>On your own lab (e.g. an open-source core with a simulated RAN), capture the relevant interfaces:</p>
          <Code>{`tshark -i any -f "sctp port 38412 or udp port 8805 or udp port 2152 or tcp port 7777" -w lab.pcapng
# Wireshark: decode SBI port as HTTP/2 via "Decode As…" if non-standard`}</Code>
          <p>Export fields to CSV/JSON and normalize to the shape on the Import page.</p>
        </S>
        <S t="Architecture">
          <Code>{`src/lib/trace-data.ts    typed teaching traces + decode-tree builder
src/lib/trace-store.tsx  React context: imported records, shared selection
src/components/lab/*     PacketTable, Timeline, DecodeTree, PacketDetail, AppShell
src/routes/*             one route per lab section (TanStack Start)`}</Code>
          <p>Shared selection state syncs the timeline, scenario pages and Trace Explorer detail pane. Imports are validated with zod.</p>
        </S>
        <S t="Setup">
          <Code>{`bun install
bun run dev      # local dev server
bun run build    # production build`}</Code>
          <p>No API keys, backend or paid services required.</p>
        </S>
      </div>
    </>
  );
}
