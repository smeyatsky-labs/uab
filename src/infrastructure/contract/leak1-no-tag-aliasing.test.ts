/**
 * LEAK-1 regression guard (Phase 1).
 *
 * The single-agent bridge (agent-to-spec.ts) copied an Agent's free-text UI tags
 * straight into the governance capabilitySet (`capabilitySet: [...agent.capabilities]`)
 * — the M3 aliasing the contract forbade. That bridge is removed. These tests
 * prove the leak is gone and cannot silently return:
 *
 *  (A) Behavioral: composerToSpec (now the single spec-producing path) sources a
 *      role's governed capabilitySet ONLY from its governed input. No free-text
 *      field (role/name/prompt) can appear in capabilitySet.
 *  (B) Structural: the bridge file is gone, and no source file anywhere aliases a
 *      `.capabilities`/`.tags` free-text surface into `capabilitySet`.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { composerToSpec, type ComposerRole } from '../../presentation/store/system-composer.store.ts';

const SRC = join(process.cwd(), 'src');

function role(over: Partial<ComposerRole>): ComposerRole {
  return {
    ref: 'root',
    role: 'supervisor',
    name: 'Supervisor',
    prompt: '',
    scopeBoundary: ['demo-tenant/root/'],
    capabilitySet: [],
    root: true,
    protocolConfig: {},
    ...over,
  };
}

/** Minimal ComposerState shape composerToSpec reads. */
function stateWith(roles: ComposerRole[]) {
  return {
    systemName: 'Sys',
    tenantId: 'demo-tenant',
    roles,
    delegations: [],
    handoffs: [],
  } as unknown as Parameters<typeof composerToSpec>[0];
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) out.push(p);
  }
  return out;
}

describe('LEAK-1 — no free-text/tags can source the governance capabilitySet', () => {
  it('(A) composerToSpec carries governed capabilitySet through unchanged', () => {
    const spec = composerToSpec(stateWith([
      role({ capabilitySet: ['read.documents', 'spawn.workers'] }),
    ]));
    expect(spec.agents[0].capabilitySet).toEqual(['read.documents', 'spawn.workers']);
  });

  it('(A) no free-text field (role/name/prompt) leaks into capabilitySet', () => {
    const spec = composerToSpec(stateWith([
      role({
        role: 'LEAKY_CLASS',
        name: 'LEAKY_NAME',
        prompt: 'LEAKY_PROMPT tag-like words',
        capabilitySet: ['read.documents'],
      }),
    ]));
    const caps = spec.agents[0].capabilitySet;
    expect(caps).toEqual(['read.documents']);
    for (const leak of ['LEAKY_CLASS', 'LEAKY_NAME', 'LEAKY_PROMPT']) {
      expect(caps).not.toContain(leak);
      expect(caps.join(' ')).not.toContain(leak);
    }
  });

  it('(B) the single-agent bridge file is removed', () => {
    expect(existsSync(join(SRC, 'infrastructure/contract/agent-to-spec.ts'))).toBe(false);
  });

  it('(B) no source file aliases a free-text .capabilities/.tags surface into capabilitySet', () => {
    const offenders: string[] = [];
    // Flags a line that assigns INTO capabilitySet from a `.capabilities` or
    // `.tags` source (spread or direct), e.g. `capabilitySet: [...agent.capabilities]`.
    const alias = /capabilitySet\s*[:=][^;\n]*\.\s*(capabilities|tags)\b/;
    for (const file of walk(SRC)) {
      const text = readFileSync(file, 'utf8');
      text.split('\n').forEach((line, i) => {
        if (alias.test(line)) offenders.push(`${file}:${i + 1}  ${line.trim()}`);
      });
    }
    expect(offenders, `tag->cap aliasing found:\n${offenders.join('\n')}`).toEqual([]);
  });
});
