import { describe, expect, it } from "vitest";
import { normalizeTsharkJson } from "./tshark-normalizer";

const sample = [
  {
    _index: "0",
    _source: {
      layers: {
        frame: {
          "frame.time_relative": "0.125000000",
          "frame.len": "112",
        },
        eth: { "eth.src": "02:00:00:00:00:01" },
        ip: {
          "ip.src": "192.0.2.10",
          "ip.dst": "192.0.2.20",
        },
        udp: {
          "udp.srcport": "2152",
          "udp.dstport": "2152",
        },
        gtp: {
          "gtp.message": "T-PDU",
          "gtp.teid": "0x00000101",
        },
        "_ws.col": {
          "_ws.col.Protocol": "GTP",
          "_ws.col.Info": "T-PDU, TEID=0x00000101",
        },
      },
    },
  },
];

describe("normalizeTsharkJson", () => {
  it("normalizes common TShark JSON packet fields", () => {
    expect(normalizeTsharkJson(sample)).toEqual([
      {
        time: 0.125,
        src: "192.0.2.10",
        dst: "192.0.2.20",
        protocol: "GTP-U",
        length: 112,
        info: "T-PDU, TEID=0x00000101",
        fields: {
          gtp: {
            "gtp.message": "T-PDU",
            "gtp.teid": "0x00000101",
          },
        },
      },
    ]);
  });

  it("supports IPv6 endpoints and packets without a reported frame length", () => {
    const packet = [{
      _source: {
        layers: {
          frame: { "frame.time_relative": "1.5" },
          ipv6: { "ipv6.src": "2001:db8::1", "ipv6.dst": "2001:db8::2" },
          "_ws.col": { "_ws.col.Protocol": "ICMPv6", "_ws.col.Info": "Echo request" },
          icmpv6: { "icmpv6.type": "128" },
        },
      },
    }];

    expect(normalizeTsharkJson(packet)[0]).toMatchObject({
      time: 1.5,
      src: "2001:db8::1",
      dst: "2001:db8::2",
      protocol: "ICMPv6",
      length: 0,
      info: "Echo request",
    });
  });

  it("rejects non-array input, empty captures, and malformed packets", () => {
    expect(() => normalizeTsharkJson({})).toThrow(/packet array/);
    expect(() => normalizeTsharkJson([])).toThrow(/no packets/);
    expect(() => normalizeTsharkJson([{}])).toThrow(/_source.layers/);
  });

  it("rejects packets without a valid relative timestamp", () => {
    const packet = [{ _source: { layers: { frame: { "frame.len": "64" } } } }];
    expect(() => normalizeTsharkJson(packet)).toThrow(/frame.time_relative/);
  });

  it("enforces the workbench packet limit", () => {
    expect(() => normalizeTsharkJson(Array.from({ length: 5001 }, () => ({})))).toThrow(/limit is 5000/);
  });
});
