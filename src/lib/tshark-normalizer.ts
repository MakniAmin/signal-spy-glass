/**
 * Normalize TShark's `tshark -T json` output into the workbench's import format.
 *
 * This module does not execute TShark or parse binary PCAP files. Run TShark locally,
 * save its JSON output, then import that JSON into the browser workbench.
 */
export interface NormalizedTraceRecord {
  time: number;
  src: string;
  dst: string;
  protocol: string;
  length: number;
  info: string;
  fields: Record<string, unknown>;
}

type JsonObject = Record<string, unknown>;

const MAX_PACKETS = 5000;

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstScalar(value: unknown): string | number | boolean | undefined {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstScalar(item);
      if (found !== undefined) return found;
    }
  }
  if (isObject(value)) {
    for (const item of Object.values(value)) {
      const found = firstScalar(item);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

function findField(value: unknown, target: string): unknown {
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findField(item, target);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  if (!isObject(value)) return undefined;
  if (Object.prototype.hasOwnProperty.call(value, target)) return value[target];
  for (const nested of Object.values(value)) {
    const found = findField(nested, target);
    if (found !== undefined) return found;
  }
  return undefined;
}

function scalarText(value: unknown): string | undefined {
  const scalar = firstScalar(value);
  return scalar === undefined ? undefined : String(scalar);
}

function toFieldValue(value: unknown): string | number | boolean | Record<string, unknown> {
  if (Array.isArray(value)) {
    const entries = value.map((item) => firstScalar(item)).filter((item) => item !== undefined);
    return entries.length ? entries.map(String).join(", ") : "(no value)";
  }
  if (isObject(value)) {
    const result: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      if (key.startsWith("_ws.col")) continue;
      result[key] = toFieldValue(nested);
    }
    return result;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  return String(value ?? "");
}

function protocolFields(layers: JsonObject): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [layerName, layerValue] of Object.entries(layers)) {
    if (layerName === "frame" || layerName.startsWith("_ws.col")) continue;
    if (layerName === "ip" || layerName === "ipv6" || layerName === "eth" || layerName === "sll" || layerName === "sll2") continue;
    if (layerName === "tcp" || layerName === "udp" || layerName === "sctp" || layerName === "icmp" || layerName === "icmpv6") continue;
    result[layerName] = toFieldValue(layerValue);
  }
  return result;
}

/** Convert TShark JSON packet output to the JSON shape accepted by the Import Trace page. */
export function normalizeTsharkJson(input: unknown): NormalizedTraceRecord[] {
  if (!Array.isArray(input)) {
    throw new Error("Expected a TShark JSON packet array (the output of tshark -T json).");
  }
  if (input.length === 0) throw new Error("The TShark JSON file contains no packets.");
  if (input.length > MAX_PACKETS) {
    throw new Error(`Capture contains ${input.length} packets; the workbench limit is ${MAX_PACKETS}.`);
  }

  return input.map((packet, index) => {
    const layers = isObject(packet) && isObject(packet._source) && isObject(packet._source.layers)
      ? packet._source.layers
      : null;
    if (!layers) throw new Error(`Packet ${index + 1} is missing the expected _source.layers object.`);

    const rawTime = firstScalar(findField(layers, "frame.time_relative"));
    const time = rawTime === undefined ? Number.NaN : Number(rawTime);
    if (!Number.isFinite(time) || time < 0) {
      throw new Error(`Packet ${index + 1} has no valid frame.time_relative value. Export with TShark's default relative-time field available.`);
    }

    const rawLength = firstScalar(findField(layers, "frame.len"));
    const parsedLength = rawLength === undefined ? undefined : Number(rawLength);
    const length = parsedLength !== undefined && Number.isInteger(parsedLength) && parsedLength >= 0 ? parsedLength : 0;

    const src = scalarText(findField(layers, "ip.src")) ?? scalarText(findField(layers, "ipv6.src")) ?? scalarText(findField(layers, "arp.src.proto_ipv4")) ?? "Unknown";
    const dst = scalarText(findField(layers, "ip.dst")) ?? scalarText(findField(layers, "ipv6.dst")) ?? scalarText(findField(layers, "arp.dst.proto_ipv4")) ?? "Unknown";
    const protocol = scalarText(findField(layers, "_ws.col.Protocol")) ?? "Unknown";
    const info = scalarText(findField(layers, "_ws.col.Info")) ?? protocol;

    return {
      time,
      src,
      dst,
      protocol: protocol.slice(0, 30),
      length,
      info: info.slice(0, 500),
      fields: protocolFields(layers),
    };
  });
}
