/**
 * CAMPAIGN STUDIO - IP address classification for SSRF protection.
 *
 * `isBlockedIp` returns true for anything that is not a plain public unicast
 * address. IPv4 uses an explicit deny list of reserved ranges; IPv6 is
 * DEFAULT-DENY: only global unicast (2000::/3) is allowed, minus documentation,
 * Teredo and 6to4 ranges. IPv4-mapped / NAT64 addresses are unwrapped and the
 * embedded IPv4 is checked. Anything that does not parse is blocked.
 */

import net from 'node:net';

/** [base address, prefix length] */
const BLOCKED_V4: ReadonlyArray<readonly [string, number]> = [
  ['0.0.0.0', 8], // "this" network
  ['10.0.0.0', 8], // private
  ['100.64.0.0', 10], // carrier-grade NAT
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local, cloud metadata (169.254.169.254)
  ['172.16.0.0', 12], // private
  ['192.0.0.0', 24], // IETF protocol assignments
  ['192.0.2.0', 24], // TEST-NET-1
  ['192.88.99.0', 24], // 6to4 relay anycast
  ['192.168.0.0', 16], // private
  ['198.18.0.0', 15], // benchmarking
  ['198.51.100.0', 24], // TEST-NET-2
  ['203.0.113.0', 24], // TEST-NET-3
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4], // reserved + broadcast
];

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const v = Number(p);
    if (v > 255) return null;
    n = n * 256 + v;
  }
  return n;
}

function inCidr(n: number, base: string, prefix: number): boolean {
  const b = ipv4ToInt(base);
  if (b === null) return false;
  const size = 2 ** (32 - prefix);
  return n >= b && n < b + size;
}

function isBlockedV4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  if (n === null) return true;
  return BLOCKED_V4.some(([base, prefix]) => inCidr(n, base, prefix));
}

/** Expands an IPv6 string into 8 16-bit groups, or null if invalid. Handles '::' and embedded IPv4. */
function expandV6(input: string): number[] | null {
  let ip = input;
  const zone = ip.indexOf('%');
  if (zone >= 0) return null; // zone ids only make sense for link-local: reject outright
  if (ip.startsWith('[') && ip.endsWith(']')) ip = ip.slice(1, -1);

  // Embedded IPv4 tail (e.g. ::ffff:1.2.3.4)
  const lastColon = ip.lastIndexOf(':');
  const tail = ip.slice(lastColon + 1);
  if (tail.includes('.')) {
    const v4 = ipv4ToInt(tail);
    if (v4 === null) return null;
    const hi = Math.floor(v4 / 65536).toString(16);
    const lo = (v4 % 65536).toString(16);
    ip = `${ip.slice(0, lastColon + 1)}${hi}:${lo}`;
  }

  const halves = ip.split('::');
  if (halves.length > 2) return null;
  const parse = (s: string): number[] | null => {
    if (s === '') return [];
    const out: number[] = [];
    for (const g of s.split(':')) {
      if (!/^[0-9a-f]{1,4}$/i.test(g)) return null;
      out.push(parseInt(g, 16));
    }
    return out;
  };
  const head = parse(halves[0]);
  if (!head) return null;
  if (halves.length === 1) return head.length === 8 ? head : null;
  const rest = parse(halves[1]);
  if (!rest) return null;
  const missing = 8 - head.length - rest.length;
  if (missing < 1) return null;
  return [...head, ...new Array(missing).fill(0), ...rest];
}

function embeddedV4(g6: number, g7: number): string {
  return `${g6 >> 8}.${g6 & 255}.${g7 >> 8}.${g7 & 255}`;
}

function isBlockedV6(ip: string): boolean {
  const g = expandV6(ip);
  if (!g) return true;

  // ::ffff:a.b.c.d (IPv4-mapped): judge by the embedded IPv4.
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) return isBlockedV4(embeddedV4(g[6], g[7]));
  // 64:ff9b::/96 (NAT64): judge by the embedded IPv4.
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) return isBlockedV4(embeddedV4(g[6], g[7]));

  // Default-deny: only global unicast 2000::/3 may pass (this excludes ::, ::1, fc00::/7, fe80::/10, ff00::/8 ...).
  if ((g[0] & 0xe000) !== 0x2000) return true;
  // 2001:db8::/32 documentation, 2001::/32 Teredo, 2002::/16 6to4
  if (g[0] === 0x2001 && g[1] === 0x0db8) return true;
  if (g[0] === 0x2001 && g[1] === 0x0000) return true;
  if (g[0] === 0x2002) return true;
  return false;
}

/** True when the address must NOT be contacted by server-side fetches. */
export function isBlockedIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) return isBlockedV4(ip);
  if (family === 6) return isBlockedV6(ip);
  // net.isIP rejects bracketed/zoned forms; try to parse those defensively, otherwise block.
  if (ip.startsWith('[')) return isBlockedV6(ip);
  return true;
}
