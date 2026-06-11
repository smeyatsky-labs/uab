/**
 * Phase 4 proof — the governance diff is empty under any protocol change.
 *
 * This is the unit-level backing for the demo's visible claim: change a role's
 * protocols however you like; governanceDiff(before, after) === []. Only editing
 * a GOVERNED field (scope/caps/lineage) — never a protocol — moves it.
 */

import { describe, expect, it } from 'vitest';
import { governedSnapshot, protocolSurface, governanceDiff } from './synthera-proof.ts';
import type { ComposerRole } from '../store/system-composer.store.ts';

function role(over: Partial<ComposerRole> = {}): ComposerRole {
  return {
    ref: 'w', role: 'worker', name: 'Worker', prompt: '',
    scopeBoundary: ['demo-tenant/w/'], capabilitySet: ['read.documents'],
    root: false, protocolConfig: {}, ...over,
  };
}

const dels = [{ parent: 'root', child: 'w' }];

describe('governance diff is empty under protocol change', () => {
  it('adding many protocols leaves the governed snapshot identical', () => {
    const before = governedSnapshot(role(), dels);
    const loaded = role({
      protocolConfig: {
        mcp: { version: '1.0', servers: ['fs'] },
        a2a: { version: '0.9' },
        ap2: { version: '0.3' },
        adk: { version: '2.1' },
      },
    });
    const after = governedSnapshot(loaded, dels);

    expect(governanceDiff(before, after)).toEqual([]);
    expect(protocolSurface(loaded)).toEqual(['a2a', 'adk', 'ap2', 'mcp']); // protocols DID move
    expect(protocolSurface(role())).toEqual([]);
  });

  it('lineage (parent) is governed: snapshot reflects the delegation edge', () => {
    expect(governedSnapshot(role(), dels).parent).toBe('root');
    expect(governedSnapshot(role({ ref: 'root', root: true }), dels).parent).toBeNull();
  });

  it('editing a GOVERNED field (scope) does move the diff — the control case', () => {
    const before = governedSnapshot(role(), dels);
    const after = governedSnapshot(role({ scopeBoundary: ['demo-tenant/w2/'] }), dels);
    const diff = governanceDiff(before, after);
    expect(diff).toHaveLength(1);
    expect(diff[0].field).toBe('scopeBoundary');
  });
});
