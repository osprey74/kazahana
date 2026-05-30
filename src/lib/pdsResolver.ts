import { fetch } from "@tauri-apps/plugin-http";

const PLC_DIRECTORY = "https://plc.directory";
const DNS_OVER_HTTPS = "https://cloudflare-dns.com/dns-query";

export type Did = string;

export interface DidDocument {
  id: string;
  alsoKnownAs?: string[];
  service?: Array<{
    id: string;
    type: string;
    serviceEndpoint: string;
  }>;
}

export interface ResolvedIdentity {
  did: Did;
  pdsUrl: string;
}

export function isDid(value: string): boolean {
  return /^did:(plc|web):[a-zA-Z0-9._:%-]+$/.test(value);
}

export function normalizeIdentifier(input: string): string {
  let s = input.trim();
  if (s.startsWith("@")) s = s.slice(1);
  if (isDid(s)) return s;
  return s.toLowerCase();
}

export async function resolveHandleToDid(handle: string): Promise<Did | null> {
  // AT Proto allows either DNS TXT or HTTPS well-known for handle→DID.
  // Different providers use different methods, so race them in parallel.
  const results = await Promise.allSettled([
    resolveHandleViaDnsOverHttps(handle),
    resolveHandleViaWellKnown(handle),
  ]);
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) return r.value;
  }
  return null;
}

async function resolveHandleViaDnsOverHttps(handle: string): Promise<Did | null> {
  try {
    const url = `${DNS_OVER_HTTPS}?name=_atproto.${encodeURIComponent(handle)}&type=TXT`;
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/dns-json" },
      connectTimeout: 5000,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      Status: number;
      Answer?: Array<{ type: number; data: string }>;
    };
    if (data.Status !== 0 || !data.Answer) return null;
    for (const ans of data.Answer) {
      if (ans.type !== 16) continue;
      const text = ans.data.replace(/^"|"$/g, "");
      const m = text.match(/^did=(did:(?:plc|web):[a-zA-Z0-9._:%-]+)$/);
      if (m && isDid(m[1])) return m[1];
    }
    return null;
  } catch {
    return null;
  }
}

async function resolveHandleViaWellKnown(handle: string): Promise<Did | null> {
  try {
    const url = `https://${handle}/.well-known/atproto-did`;
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "text/plain" },
      connectTimeout: 5000,
    });
    if (!res.ok) return null;
    const text = (await res.text()).trim();
    return isDid(text) ? text : null;
  } catch {
    return null;
  }
}

export async function fetchDidDocument(did: Did): Promise<DidDocument | null> {
  if (!isDid(did)) return null;
  const url = didDocumentUrl(did);
  if (!url) return null;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      connectTimeout: 5000,
    });
    if (!res.ok) return null;
    return (await res.json()) as DidDocument;
  } catch {
    return null;
  }
}

function didDocumentUrl(did: Did): string | null {
  if (did.startsWith("did:plc:")) {
    return `${PLC_DIRECTORY}/${did}`;
  }
  if (did.startsWith("did:web:")) {
    const parts = did.slice("did:web:".length).split(":");
    const host = parts[0];
    if (!host) return null;
    return parts.length === 1
      ? `https://${host}/.well-known/did.json`
      : `https://${host}/${parts.slice(1).join("/")}/did.json`;
  }
  return null;
}

export function extractPdsEndpoint(doc: DidDocument): string | null {
  if (!doc.service) return null;
  for (const svc of doc.service) {
    const idMatches = svc.id === "#atproto_pds" || svc.id.endsWith("#atproto_pds");
    const typeMatches = svc.type === "AtprotoPersonalDataServer";
    if (idMatches || typeMatches) {
      return svc.serviceEndpoint.replace(/\/$/, "");
    }
  }
  return null;
}

export async function resolveIdentifierToPds(
  identifier: string,
): Promise<ResolvedIdentity | null> {
  const normalized = normalizeIdentifier(identifier);
  const did = isDid(normalized) ? normalized : await resolveHandleToDid(normalized);
  if (!did) return null;
  const doc = await fetchDidDocument(did);
  if (!doc) return null;
  const pdsUrl = extractPdsEndpoint(doc);
  if (!pdsUrl) return null;
  return { did, pdsUrl };
}
