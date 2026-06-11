/**
 * LEAK-2 wall-off guard (Phase 2).
 *
 * ProtocolSpec used to carry a field named `capabilities` (a descriptive protocol
 * feature list) — a third thing named "capabilities" that the Phase-3 per-role
 * protocol wiring sits right next to. The risk: that list gets sourced into the
 * governance capabilitySet, conferring authority from a protocol descriptor.
 *
 * It is renamed `protocolFeatures` so the word "capabilities" never names a
 * non-governed surface in the protocol/governance path. These tests prove:
 *  (A) the rename is real — every catalog ProtocolSpec exposes `protocolFeatures`
 *      and no `capabilities` field.
 *  (B) inertness — no source aliases `protocolFeatures` (or a protocol-spec
 *      `.capabilities`) into `capabilitySet`.
 *  (C) bounding — a role's governed capabilitySet is independent of protocol
 *      feature data; an aggressive feature list cannot widen the governed set.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ALL_PROTOCOL_SPECS } from '../data/protocols.index.ts';
import { composerToSpec, type ComposerRole } from '../../presentation/store/system-composer.store.ts';

const SRC = join(process.cwd(), 'src');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) out.push(p);
  }
  return out;
}

describe('LEAK-2 — protocol features are inert; "capabilities" is not a protocol-spec field', () => {
  it('(A) every catalog ProtocolSpec exposes protocolFeatures and no capabilities field', () => {
    expect(ALL_PROTOCOL_SPECS.length).toBeGreaterThan(0);
    for (const spec of ALL_PROTOCOL_SPECS) {
      expect(Array.isArray(spec.protocolFeatures), `${spec.metadata.id} missing protocolFeatures`).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(spec, 'capabilities'),
        `${spec.metadata.id} still has a 'capabilities' field`).toBe(false);
    }
  });

  it('(B) no source aliases protocolFeatures (or a protocol .capabilities) into capabilitySet', () => {
    const offenders: string[] = [];
    const alias = /capabilitySet\s*[:=][^;\n]*\.\s*(protocolFeatures|capabilities)\b/;
    for (const file of walk(SRC)) {
      readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
        if (alias.test(line)) offenders.push(`${file}:${i + 1}  ${line.trim()}`);
      });
    }
    expect(offenders, `protocol-feature -> cap aliasing found:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('(C) a role bounded by a restricted capabilitySet stays restricted regardless of protocol features', () => {
    // The governed authority is the role's capabilitySet alone. Even with a
    // protocol whose feature list is aggressive, the composed governed set is
    // exactly what was authored — protocol features confer nothing.
    const aggressive = ALL_PROTOCOL_SPECS.reduce(
      (n, s) => Math.max(n, s.protocolFeatures.length), 0);
    expect(aggressive).toBeGreaterThan(0); // catalog really does carry rich features

    const restricted: ComposerRole = {
      ref: 'root', role: 'supervisor', name: 'Supervisor', prompt: '',
      scopeBoundary: ['demo-tenant/root/'], capabilitySet: ['read.documents'], root: true,
      protocolConfig: {},
    };
    const state = {
      systemName: 'Sys', tenantId: 'demo-tenant', roles: [restricted],
      delegations: [], handoffs: [],
    } as unknown as Parameters<typeof composerToSpec>[0];

    expect(composerToSpec(state).agents[0].capabilitySet).toEqual(['read.documents']);
  });
});
