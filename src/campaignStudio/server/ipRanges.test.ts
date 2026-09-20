import test from 'node:test';
import assert from 'node:assert/strict';
import { isBlockedIp } from './ipRanges.js';

test('IPv4: private, loopback, link-local, CGNAT, reserved and multicast are blocked', () => {
  const blocked = [
    '0.0.0.0', '0.1.2.3', '10.0.0.1', '10.255.255.255', '100.64.0.1', '100.127.255.255', '127.0.0.1', '127.255.255.254',
    '169.254.169.254', '169.254.0.1', '172.16.0.1', '172.31.255.255', '192.0.0.1', '192.0.2.5', '192.168.0.1', '192.168.255.255',
    '198.18.0.1', '198.19.255.255', '198.51.100.7', '203.0.113.9', '224.0.0.1', '239.255.255.255', '240.0.0.1', '255.255.255.255',
  ];
  for (const ip of blocked) assert.equal(isBlockedIp(ip), true, `should block ${ip}`);
});

test('IPv4: ordinary public addresses and range edges are allowed', () => {
  const allowed = ['8.8.8.8', '1.1.1.1', '93.184.216.34', '172.15.255.255', '172.32.0.1', '100.63.255.255', '100.128.0.1', '11.0.0.1', '198.17.255.255', '198.20.0.1', '223.255.255.255'];
  for (const ip of allowed) assert.equal(isBlockedIp(ip), false, `should allow ${ip}`);
});

test('IPv6: loopback, unspecified, link-local, unique-local, multicast are blocked (default-deny)', () => {
  const blocked = ['::', '::1', 'fe80::1', 'febf::1', 'fc00::1', 'fd12:3456:789a::1', 'ff02::1', 'fec0::1', '100::1', '::2'];
  for (const ip of blocked) assert.equal(isBlockedIp(ip), true, `should block ${ip}`);
});

test('IPv6: IPv4-mapped and NAT64 addresses are judged by the embedded IPv4', () => {
  for (const ip of ['::ffff:127.0.0.1', '::ffff:7f00:1', '::ffff:10.0.0.1', '::ffff:169.254.169.254', '64:ff9b::7f00:1', '64:ff9b::a00:1']) {
    assert.equal(isBlockedIp(ip), true, `should block ${ip}`);
  }
  for (const ip of ['::ffff:8.8.8.8', '64:ff9b::808:808']) {
    assert.equal(isBlockedIp(ip), false, `should allow ${ip}`);
  }
});

test('IPv6: documentation, Teredo and 6to4 ranges are blocked; real global unicast allowed', () => {
  for (const ip of ['2001:db8::1', '2001:0:4136:e378:8000:63bf:3fff:fdd2', '2002:7f00:1::1', '2002:c0a8:1::1']) {
    assert.equal(isBlockedIp(ip), true, `should block ${ip}`);
  }
  for (const ip of ['2606:4700:4700::1111', '2001:4860:4860::8888', '2a00:1450:4009:81b::200e']) {
    assert.equal(isBlockedIp(ip), false, `should allow ${ip}`);
  }
});

test('garbage, shorthand and zoned addresses fail closed', () => {
  for (const ip of ['', 'not-an-ip', '127.1', '0x7f.0.0.1', '2130706433', '1.2.3', '1.2.3.4.5', 'fe80::1%eth0', '::g', '1::2::3', '[::1]', '300.1.1.1']) {
    assert.equal(isBlockedIp(ip), true, `should block ${JSON.stringify(ip)}`);
  }
});
