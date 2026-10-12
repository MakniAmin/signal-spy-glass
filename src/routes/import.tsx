import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { PageHeader } from "@/components/lab/bits";
import { useTrace } from "@/lib/trace-store";
import { toTree, type Packet } from "@/lib/trace-data";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/import")({
  head: () => meta("Import Trace", "Import normalized JSON packet records exported from Wireshark/tshark into the workbench."),
  component: Page,
});

const scalar = z.union([z.string(), z.number(), z.boolean()]);
type F = { [k: string]: z.infer<typeof scalar> | F };
const fieldsSchema: z.ZodType<F> = z.lazy(() => z.record(z.union([scalar, fieldsSchema])));

const recordSchema = z.object({
  time: z.number().nonnegative(),
  src: z.string().trim().min(1).max(100),
  dst: z.string().trim().min(1).max(100),
  protocol: z.string().trim().min(1).max(30),
  length: z.number().int().nonnegative().optional(),
  info: z.string().max(500),
  srcNode: z.string().max(30).optional(),
  dstNode: z.string().max(30).optional(),
  step: z.string().max(80).optional(),
  explain: z.string().max(1000).optional(),
  fields: fieldsSchema.optional(),
});
const fileSchema = z.array(recordSchema).min(1).max(5000);

const EXAMPLE = `[
  {
    "time": 0.0,
    "src": "192.0.2.10",
    "dst": "192.0.2.20",
    "protocol": "S1AP",
    "length": 150,
    "info": "InitialUEMessage, Attach request",
    "srcNode": "eNB",
    "dstNode": "MME",
    "fields": { "procedureCode": "12", "NAS": { "Message type": "Attach request" } }
  }
]`;

function Page() {
  const { setImported, imported, resetToDemo } = useTrace();
  const [errors, setErrors] = useState<string[]>([]);
  const [ok, setOk] = useState<string | null>(null);

  const handle = async (file: File) => {
    setErrors([]); setOk(null);
    if (file.size > 5_000_000) return setErrors(["File is larger than 5 MB."]);
    if (/\.(pcap|pcapng|cap)$/i.test(file.name)) return setErrors(["PCAP/PCAPNG files are not decoded here. Decode in Wireshark/tshark and export normalized JSON (see below)."]);
    let data: unknown;
    try { data = JSON.parse(await file.text()); } catch { return setErrors(["File is not valid JSON."]); }
    const r = fileSchema.safeParse(data);
    if (!r.success) return setErrors(r.error.issues.slice(0, 12).map((i) => `${i.path.length ? `[${i.path.join(".")}] ` : ""}${i.message}`));
    const pkts: Packet[] = r.data.map((d, i) => ({
      id: `imported-${i + 1}`, no: i + 1, time: d.time, src: d.src, dst: d.dst,
      srcNode: d.srcNode ?? d.src, dstNode: d.dstNode ?? d.dst, protocol: d.protocol,
      length: d.length ?? 0, info: d.info, scenario: "imported", step: d.step ?? "Imported",
      iface: "—", plane: d.protocol === "GTP-U" ? "user" : "control", explain: d.explain ?? "",
      tree: d.fields ? toTree({ [d.protocol]: d.fields as never }) : [{ label: d.protocol, value: d.info }], demo: false,
    }));
    setImported(pkts);
    setOk(`Imported ${pkts.length} records from ${file.name}.`);
  };

  return (
    <>
      <PageHeader eyebrow="Import Trace" title="Bring your own normalized records" badge={false}>
        This workbench does <strong>not</strong> parse PCAP/PCAPNG. Decode captures in Wireshark or tshark, export selected fields, and normalize them
        to the JSON shape below. Data stays in your browser (local storage) and is never uploaded.
      </PageHeader>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-4">
          <label className="block rounded-md border border-dashed border-input p-6 text-center hover:border-primary">
            <span className="text-sm">Choose a <span className="font-mono">.json</span> file</span>
            <input type="file" accept=".json,application/json,.pcap,.pcapng" className="mt-3 block w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-primary-foreground"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); e.target.value = ""; }} />
          </label>
          {errors.length > 0 && (
            <div role="alert" className="mt-3 rounded border border-destructive/50 bg-destructive/10 p-3 text-sm">
              <p className="font-semibold text-destructive">Import failed</p>
              <ul className="mt-1 list-disc pl-5 font-mono text-xs">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
            </div>
          )}
          {ok && (
            <p role="status" className="mt-3 rounded border border-ok/50 bg-ok/10 p-3 text-sm">
              {ok} <Link to="/explorer" search={{ scenario: "imported" }} className="text-primary hover:underline">View in Trace Explorer →</Link>
            </p>
          )}
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Currently imported: <span className="font-mono text-primary">{imported.length}</span></span>
            <button onClick={() => { resetToDemo(); setOk(null); setErrors([]); }} className="rounded-md border border-input px-3 py-1.5 hover:bg-accent">Reset to demo data</button>
          </div>
        </section>
        <section className="panel p-4">
          <h2 className="eyebrow mb-2">Expected shape</h2>
          <p className="mb-2 text-sm text-muted-foreground">Required: time, src, dst, protocol, info. Optional: length, srcNode, dstNode, step, explain, fields (nested object → decode tree).</p>
          <pre className="overflow-x-auto rounded bg-background/60 p-3 font-mono text-xs">{EXAMPLE}</pre>
        </section>
      </div>
      <section className="panel mt-4 p-4 text-sm">
        <h2 className="eyebrow mb-2">Export from tshark (example)</h2>
        <pre className="overflow-x-auto rounded bg-background/60 p-3 font-mono text-xs text-primary">{`tshark -r lab.pcapng -Y "ngap || pfcp || gtp" -T fields \\
  -e frame.time_relative -e ip.src -e ip.dst -e _ws.col.Protocol \\
  -e frame.len -e _ws.col.Info -E separator=, -E quote=d > lab.csv
# then convert CSV rows to the JSON array above (e.g. a small Python script)`}</pre>
      </section>
    </>
  );
}
