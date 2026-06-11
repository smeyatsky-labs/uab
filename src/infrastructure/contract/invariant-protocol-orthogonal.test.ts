/**
 * THE INVARIANT GUARD (Phase 3d) — protocols are orthogonal to governance.
 *
 * "SYNTHERA under everything": an agent's authority comes ONLY from its governed
 * fields (scopeBoundary, capabilitySet, lineage, identity). protocolConfig is what
 * it SPEAKS, never what it IS. This guard proves that changing a role's protocols
 * produces ZERO change in any governed field — at the pure composerToSpec level
 * and through the real store actions (the live path). If a protocol choice ever
 * moves a governed value, these tests fail.
 *
 * It also confirms protocols stay opaque to validation/attenuation (Phase 3e):
 * the same governed envelope validates identically with or without protocols.
 */

import { describe, expect, it } from 'vitest';
import {
  useComposerStore,
  composerToSpec,
  type ComposerRole,
} from '../../presentation/store/system-composer.store.ts';
import { validateGovernedSystemSpec } from './governed-system-spec.validator.ts';
import type { GovernedSystemSpec } from './governed-system-spec.ts';

/** Every governed field of an agent — what the substrate mints/enforces. */
function governed(spec: GovernedSystemSpec) {
  return spec.agents.map((a) => ({
    ref: a.ref, role: a.role, name: a.name, prompt: a.prompt,
    scopeBoundary: a.scopeBoundary, capabilitySet: a.capabilitySet, root: a.root,
  }));
}

function role(over: Partial<ComposerRole>): ComposerRole {
  return {
    ref: 'r', role: 'worker', name: 'R', prompt: '',
    scopeBoundary: ['demo-tenant/'], capabilitySet: ['read.documents'],
    root: false, protocolConfig: {}, ...over,
  };
}

function stateWith(roles: ComposerRole[], delegations: { parent: string; child: string }[] = []) {
  return {
    systemName: 'Sys', tenantId: 'demo-tenant', roles, delegations, handoffs: [],
  } as unknown as Parameters<typeof composerToSpec>[0];
}

describe('INVARIANT — a role\'s protocols never move its governed fields', () => {
  it('(composerToSpec) the governed envelope is byte-identical with and without protocols', () => {
    const bare = [
      role({ ref: 'root', role: 'supervisor', name: 'Root', scopeBoundary: ['demo-tenant/'], capabilitySet: ['read.documents', 'spawn.workers'], root: true }),
      role({ ref: 'w', role: 'worker', name: 'Worker', scopeBoundary: ['demo-tenant/w/'], capabilitySet: ['read.documents'] }),
    ];
    const dels = [{ parent: 'root', child: 'w' }];
    const specBefore = composerToSpec(stateWith(bare, dels));

    // Pile arbitrary protocols + config onto BOTH roles. Go wild.
    const loaded = bare.map((r) => ({
      ...r,
      protocolConfig: {
        mcp: { version: '1.0', servers: ['fs', 'http'], contextWindow: 200000 },
        a2a: { version: '0.9', discoveryPort: 8443, secure: true },
        ap2: { version: '0.3', rails: ['card', 'ach'] },
        adk: { version: '2.1', workflow: 'sequential' },
      },
    }));
    const specAfter = composerToSpec(stateWith(loaded, dels));

    // The governance did NOT move.
    expect(governed(specAfter)).toEqual(governed(specBefore));
    expect(specAfter.delegations).toEqual(specBefore.delegations);
    expect(specAfter.tenant).toEqual(specBefore.tenant);

    // The protocols DID move (sanity: the change was real, not a no-op).
    expect(specAfter.agents[0].protocolConfig).not.toEqual(specBefore.agents[0].protocolConfig);
    expect(Object.keys(specAfter.agents[1].protocolConfig ?? {})).toEqual(['mcp', 'a2a', 'ap2', 'adk']);
  });

  it('(store actions, the live path) toggling/configuring protocols changes ZERO governed field', () => {
    const store = useComposerStore.getState();
    store.reset();
    store.addRole();

    const refs = useComposerStore.getState().roles.map((r) => r.ref);
    const before = JSON.parse(JSON.stringify(governed(composerToSpec(useComposerStore.getState()))));

    // Live actions: select protocols on every role, then edit a config field.
    for (const ref of refs) {
      useComposerStore.getState().toggleRoleProtocol(ref, 'mcp', { version: '1.0' });
      useComposerStore.getState().toggleRoleProtocol(ref, 'a2a', { version: '0.9' });
    }
    useComposerStore.getState().setRoleProtocolConfig(refs[0], 'mcp', { version: '1.0', servers: ['fs'] });

    const after = governed(composerToSpec(useComposerStore.getState()));

    expect(after).toEqual(before);                       // governance unmoved
    // protocols actually attached (the actions were not no-ops):
    const liveRoles = useComposerStore.getState().roles;
    expect(Object.keys(liveRoles[0].protocolConfig).sort()).toEqual(['a2a', 'mcp']);

    store.reset();
  });

  it('(Phase 3e) protocols are opaque to validation: same verdict with or without them', () => {
    const roles = [
      role({ ref: 'root', role: 'supervisor', name: 'Root', scopeBoundary: ['demo-tenant/'], capabilitySet: ['read.documents'], root: true }),
      role({ ref: 'w', role: 'worker', name: 'Worker', scopeBoundary: ['demo-tenant/w/'], capabilitySet: ['read.documents'] }),
    ];
    const dels = [{ parent: 'root', child: 'w' }];
    const withProtocols = roles.map((r) => ({ ...r, protocolConfig: { mcp: { version: '1.0' }, ap2: { version: '0.3' } } }));

    expect(validateGovernedSystemSpec(composerToSpec(stateWith(roles, dels)))).toEqual([]);
    expect(validateGovernedSystemSpec(composerToSpec(stateWith(withProtocols, dels)))).toEqual([]);
  });

  it('(Phase 3e) attenuation still rejects an over-envelope child regardless of protocols', () => {
    // Child scope escapes parent; protocols on both must not rescue it.
    const roles = [
      role({ ref: 'root', role: 'supervisor', name: 'Root', scopeBoundary: ['demo-tenant/safe/'], capabilitySet: ['read.documents'], root: true, protocolConfig: { mcp: { version: '1.0' } } }),
      role({ ref: 'w', role: 'worker', name: 'Worker', scopeBoundary: ['demo-tenant/secret/'], capabilitySet: ['read.documents'], protocolConfig: { a2a: { version: '0.9' } } }),
    ];
    const errors = validateGovernedSystemSpec(composerToSpec(stateWith(roles, [{ parent: 'root', child: 'w' }])));
    expect(errors.some((e) => e.code === 'scope-not-attenuated')).toBe(true);
  });
});
