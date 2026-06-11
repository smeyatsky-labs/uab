/**
 * System Composer store (Phase 3 Part B) — compose a GovernedSystemSpec.
 *
 * The user composes ROLES and PERMITTED DELEGATION (the envelope, D5): which
 * roles exist and which role MAY spawn which children, attenuated. This is NOT a
 * fixed instance list. One tenant, one root, single-parent tree (D1/D3). Scope
 * is templated per role as a resource prefix (D4). The derived spec is validated
 * live against the forge-agents-owned schema (D6) before it can be provisioned.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { nanoid } from 'nanoid';
import {
  SPEC_VERSION,
  type AgentRole,
  type DelegationEdge,
  type GovernedSystemSpec,
  type HandoffEdge,
} from '../../infrastructure/contract/governed-system-spec.ts';
import {
  validateGovernedSystemSpec,
  type ValidationError,
} from '../../infrastructure/contract/governed-system-spec.validator.ts';

export interface ComposerRole {
  ref: string;
  role: string;
  name: string;
  prompt: string;
  scopeBoundary: string[];
  capabilitySet: string[];
  root: boolean;
  /**
   * The protocols this role speaks, keyed by protocolId — each value a config
   * map ({ version, ...config }). This is the PRIMARY per-role builder surface.
   * It is OPAQUE to governance: it flows only into GovernedSystemSpec.protocolConfig
   * and the deployed agent's runtime. It is NEVER a source of scope/capability/
   * identity. Selecting a protocol adds a key here; it changes no governed field.
   */
  protocolConfig: Record<string, Record<string, unknown>>;
}

export type ProvisionStatus = 'idle' | 'validating' | 'provisioning' | 'done' | 'error';

interface ComposerState {
  systemName: string;
  tenantId: string;
  roles: ComposerRole[];
  /** Permitted-delegation edges (governance). parent MAY spawn child. */
  delegations: DelegationEdge[];
  /** Runtime messaging edges (kept VISIBLY DISTINCT from delegation, D7). */
  handoffs: HandoffEdge[];
  status: ProvisionStatus;
  result: unknown | null;
  error: string | null;

  setSystemName: (v: string) => void;
  setTenantId: (v: string) => void;
  addRole: () => void;
  updateRole: (ref: string, patch: Partial<ComposerRole>) => void;
  removeRole: (ref: string) => void;
  setRoot: (ref: string) => void;
  addDelegation: (parent: string, child: string) => void;
  removeDelegation: (parent: string, child: string) => void;
  /** Toggle a protocol on a role. `seed` is the initial config when adding. Opaque to governance. */
  toggleRoleProtocol: (ref: string, protocolId: string, seed: Record<string, unknown>) => void;
  /** Update one protocol's config map on a role. Opaque to governance. */
  setRoleProtocolConfig: (ref: string, protocolId: string, config: Record<string, unknown>) => void;
  setStatus: (s: ProvisionStatus, payload?: { result?: unknown; error?: string }) => void;
  reset: () => void;
}

/** D4: a resource-prefix scope templated from tenant + ref. Never a verb. */
export function templateScope(tenantId: string, ref: string): string[] {
  return [`${tenantId}/${ref}/`];
}

function seedRoles(tenantId: string): ComposerRole[] {
  return [
    {
      ref: 'root',
      role: 'supervisor',
      name: 'Supervisor',
      prompt: '',
      scopeBoundary: templateScope(tenantId, 'root'),
      capabilitySet: ['read.documents', 'spawn.workers'],
      root: true,
      protocolConfig: {},
    },
  ];
}

export const useComposerStore = create<ComposerState>()(
  immer((set) => ({
    systemName: 'My Governed System',
    tenantId: 'demo-tenant',
    roles: seedRoles('demo-tenant'),
    delegations: [],
    handoffs: [],
    status: 'idle',
    result: null,
    error: null,

    setSystemName: (v) => set((s) => { s.systemName = v; }),
    setTenantId: (v) => set((s) => { s.tenantId = v; }),

    addRole: () => set((s) => {
      const ref = `role-${nanoid(5)}`;
      s.roles.push({
        ref,
        role: 'worker',
        name: 'New Role',
        prompt: '',
        scopeBoundary: templateScope(s.tenantId, ref),
        capabilitySet: ['read.documents'],
        root: false,
        protocolConfig: {},
      });
    }),

    updateRole: (ref, patch) => set((s) => {
      const r = s.roles.find((x) => x.ref === ref);
      if (r) Object.assign(r, patch);
    }),

    removeRole: (ref) => set((s) => {
      s.roles = s.roles.filter((r) => r.ref !== ref);
      s.delegations = s.delegations.filter((d) => d.parent !== ref && d.child !== ref);
    }),

    setRoot: (ref) => set((s) => {
      for (const r of s.roles) r.root = r.ref === ref;
      // the new root cannot be anyone's delegation child
      s.delegations = s.delegations.filter((d) => d.child !== ref);
    }),

    addDelegation: (parent, child) => set((s) => {
      if (parent === child) return;
      if (s.delegations.some((d) => d.parent === parent && d.child === child)) return;
      s.delegations.push({ parent, child });
    }),

    removeDelegation: (parent, child) => set((s) => {
      s.delegations = s.delegations.filter((d) => !(d.parent === parent && d.child === child));
    }),

    // Protocols are opaque to governance: these actions touch ONLY protocolConfig.
    // They never read or write scopeBoundary / capabilitySet / root / delegations.
    toggleRoleProtocol: (ref, protocolId, seed) => set((s) => {
      const r = s.roles.find((x) => x.ref === ref);
      if (!r) return;
      if (protocolId in r.protocolConfig) delete r.protocolConfig[protocolId];
      else r.protocolConfig[protocolId] = { ...seed };
    }),

    setRoleProtocolConfig: (ref, protocolId, config) => set((s) => {
      const r = s.roles.find((x) => x.ref === ref);
      if (!r) return;
      r.protocolConfig[protocolId] = config;
    }),

    setStatus: (status, payload) => set((s) => {
      s.status = status;
      if (payload?.result !== undefined) s.result = payload.result;
      if (payload?.error !== undefined) s.error = payload.error;
    }),

    reset: () => set((s) => {
      s.roles = seedRoles(s.tenantId);
      s.delegations = [];
      s.handoffs = [];
      s.status = 'idle';
      s.result = null;
      s.error = null;
    }),
  })),
);

/** Derive the GovernedSystemSpec from composer state. */
export function composerToSpec(state: ComposerState): GovernedSystemSpec {
  const agents: AgentRole[] = state.roles.map((r) => ({
    ref: r.ref,
    role: r.role,
    name: r.name,
    prompt: r.prompt,
    scopeBoundary: r.scopeBoundary,
    capabilitySet: r.capabilitySet,
    root: r.root,
    // Opaque pass-through (M4). The engine/substrate never read this; it rides
    // to the deployed agent's runtime. It is NOT a source of any governed field.
    protocolConfig: r.protocolConfig,
  }));
  return {
    specVersion: SPEC_VERSION,
    system: { id: 'sys', name: state.systemName },
    tenant: { id: state.tenantId },
    agents,
    delegations: state.delegations,
    handoffs: state.handoffs,
  };
}

export function composerErrors(state: ComposerState): ValidationError[] {
  return validateGovernedSystemSpec(composerToSpec(state));
}
