/**
 * Compose-time validation tests (Part B / Gate B).
 *
 * Proves the UI validator accepts a valid one-root attenuated envelope and
 * rejects every illegal shape the engine/substrate won't honor (the
 * checks-the-engine-can't-cash guard). Mirrors the forge-agents Phase-1 suite.
 */

import { describe, expect, it } from 'vitest';
import type { GovernedSystemSpec } from './governed-system-spec.ts';
import { validateGovernedSystemSpec } from './governed-system-spec.validator.ts';

function validSpec(): GovernedSystemSpec {
  return {
    specVersion: '1.0',
    system: { id: 'sys-1', name: 'Research Desk' },
    tenant: { id: 'acme' },
    agents: [
      { ref: 'root', role: 'operator-root', name: 'Root', scopeBoundary: ['acme/'], capabilitySet: ['read.documents', 'spawn.workers'], root: true },
      { ref: 'supervisor', role: 'supervisor', name: 'Supervisor', scopeBoundary: ['acme/research/'], capabilitySet: ['read.documents', 'spawn.workers'] },
      { ref: 'worker', role: 'worker', name: 'Worker', scopeBoundary: ['acme/research/output/'], capabilitySet: ['read.documents'] },
    ],
    delegations: [
      { parent: 'root', child: 'supervisor' },
      { parent: 'supervisor', child: 'worker' },
    ],
  };
}

const codes = (s: GovernedSystemSpec) => validateGovernedSystemSpec(s).map((e) => e.code);

describe('accept', () => {
  it('accepts a one-root attenuated delegation tree', () => {
    expect(validateGovernedSystemSpec(validSpec())).toEqual([]);
  });
  it('accepts a lone root with no delegations', () => {
    const s = validSpec();
    s.agents = [s.agents[0]];
    s.delegations = [];
    expect(validateGovernedSystemSpec(s)).toEqual([]);
  });
});

describe('reject (one per illegal shape)', () => {
  it('rejects no root', () => {
    const s = validSpec();
    s.agents[0] = { ...s.agents[0], root: false };
    expect(codes(s)).toContain('root-cardinality');
  });
  it('rejects multiple roots', () => {
    const s = validSpec();
    s.agents[1] = { ...s.agents[1], root: true };
    expect(codes(s)).toContain('root-cardinality');
  });
  it('rejects a multi-parent child', () => {
    const s = validSpec();
    s.delegations.push({ parent: 'root', child: 'worker' });
    expect(codes(s)).toContain('multi-parent');
  });
  it('rejects an edge to an unknown role', () => {
    const s = validSpec();
    s.delegations.push({ parent: 'supervisor', child: 'ghost' });
    expect(codes(s)).toContain('unknown-child');
  });
  it('rejects broader-than-parent scope', () => {
    const s = validSpec();
    s.agents[2] = { ...s.agents[2], scopeBoundary: ['acme/secret/'] };
    expect(codes(s)).toContain('scope-not-attenuated');
  });
  it('rejects empty-scope-inherit under a restricted parent', () => {
    const s = validSpec();
    s.agents[2] = { ...s.agents[2], scopeBoundary: [] };
    expect(codes(s)).toContain('scope-not-attenuated');
  });
  it('rejects a capability exceeding the parent', () => {
    const s = validSpec();
    s.agents[2] = { ...s.agents[2], capabilitySet: ['read.documents', 'delete.everything'] };
    expect(codes(s)).toContain('caps-not-attenuated');
  });
  it('rejects an action-verb scope (colon form)', () => {
    const s = validSpec();
    s.agents[1] = { ...s.agents[1], scopeBoundary: ['read:acme/research/'] };
    expect(codes(s)).toContain('action-verb-scope');
  });
  it('rejects an action-verb scope (leading segment)', () => {
    const s = validSpec();
    s.agents[1] = { ...s.agents[1], scopeBoundary: ['write/acme/research/'] };
    expect(codes(s)).toContain('action-verb-scope');
  });
  it('rejects self-delegation', () => {
    const s = validSpec();
    s.delegations.push({ parent: 'worker', child: 'worker' });
    expect(codes(s)).toContain('self-delegation');
  });
  it('rejects a disconnected role', () => {
    const s = validSpec();
    s.agents.push({ ref: 'orphan', role: 'orphan', name: 'Orphan', scopeBoundary: ['acme/research/output/'], capabilitySet: ['read.documents'] });
    expect(codes(s)).toContain('unrooted');
  });
  it('rejects a cycle (root cannot be a child)', () => {
    const s = validSpec();
    s.delegations.push({ parent: 'worker', child: 'root' });
    expect(codes(s)).toContain('root-is-child');
  });
});
