import { describe, expect, it } from "vitest";
import { parseStoredImportedPackets } from "./trace-store";

const validImportedPacket = {
  id: "imported-1",
  no: 1,
  time: 0.125,
  src: "192.0.2.10",
  dst: "192.0.2.20",
  srcNode: "192.0.2.10",
  dstNode: "192.0.2.20",
  protocol: "NGAP",
  length: 128,
  info: "InitialUEMessage",
  scenario: "imported",
  step: "Imported",
  iface: "—",
  plane: "control",
  explain: "",
  tree: [{ label: "NGAP", children: [{ label: "Procedure", value: "InitialUEMessage" }] }],
  demo: false,
};

describe("parseStoredImportedPackets", () => {
  it("accepts a valid imported packet array", () => {
    expect(parseStoredImportedPackets(JSON.stringify([validImportedPacket]))).toEqual([validImportedPacket]);
  });

  it("rejects malformed JSON", () => {
    expect(parseStoredImportedPackets("{not json")).toBeNull();
  });

  it("rejects records that do not match the stored imported-packet shape", () => {
    expect(parseStoredImportedPackets(JSON.stringify([{ ...validImportedPacket, time: -1 }]))).toBeNull();
    expect(parseStoredImportedPackets(JSON.stringify([{ ...validImportedPacket, scenario: "5gsa", demo: true }]))).toBeNull();
  });

  it("rejects non-array values and arrays over the supported record limit", () => {
    expect(parseStoredImportedPackets(JSON.stringify({ packet: validImportedPacket }))).toBeNull();
    expect(parseStoredImportedPackets(JSON.stringify(Array.from({ length: 5001 }, () => validImportedPacket)))).toBeNull();
  });
});
