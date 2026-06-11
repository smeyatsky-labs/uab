/**
 * SystemComposerPage (Phase 3 Part B) — compose a GOVERNED MULTI-AGENT SYSTEM.
 *
 * The primary builder flow (replaces the single-agent wizard). The user composes
 * ROLES and PERMITTED DELEGATION (the envelope, D5): one tenant, one root, a
 * single-parent delegation tree (D1/D3). Governance (permitted delegation) is
 * kept VISIBLY DISTINCT from runtime handoffs (D7) as two separate sections.
 * Scope is templated per role as a resource prefix (D4). The composed spec is
 * validated live against the forge-agents-owned schema (D6/B4): illegal shapes
 * are rejected here, before "Provision" can reach the engine. "Provision" calls
 * the real BuilderPort provisioning engine (B5).
 */

import { useMemo, useState } from 'react';
import { AlertTriangle, Boxes, CheckCircle2, Plus, Rocket, Shield, Trash2, Workflow } from 'lucide-react';
import { GlassPanel } from '../components/ui/GlassPanel.tsx';
import { NeonButton } from '../components/ui/NeonButton.tsx';
import { ProtocolSelector } from '../components/protocols/ProtocolSelector.tsx';
import { ProtocolConfigurator } from '../components/protocols/ProtocolConfigurator.tsx';
import { useProtocolRegistry } from '../hooks/useProtocolRegistry.ts';
import type { ProtocolId } from '../../domain/protocols/protocol.types.ts';
import {
  composerErrors,
  composerToSpec,
  useComposerStore,
  type ComposerRole,
} from '../store/system-composer.store.ts';
import { provisionSystem } from '../../infrastructure/adapters/forge-provisioning-builder.service.ts';

/**
 * The per-role protocol surface — the PRIMARY, dominant builder choice (D-D=A).
 * Selection lives in the role's opaque protocolConfig; toggling/configuring a
 * protocol touches NO governed field. SYNTHERA is not in this catalog; it is the
 * substrate underneath whatever is chosen here.
 */
function RoleProtocols({ role }: { role: ComposerRole }) {
  const { getById } = useProtocolRegistry();
  const toggleRoleProtocol = useComposerStore((s) => s.toggleRoleProtocol);
  const setRoleProtocolConfig = useComposerStore((s) => s.setRoleProtocolConfig);
  const selected = Object.keys(role.protocolConfig) as ProtocolId[];

  const onToggle = (id: ProtocolId) => {
    const spec = getById(id);
    // Seed with the protocol's own version + defaults — pure runtime detail.
    const seed = { version: spec?.metadata.version ?? '0.0.0', ...(spec?.defaultConfig ?? {}) };
    toggleRoleProtocol(role.ref, id, seed);
  };

  return (
    <div className="space-y-3 rounded-lg border border-secondary/20 bg-secondary/[0.03] p-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-100">
        <Boxes size={14} className="text-secondary" /> Protocols — what this role speaks
        <span className="ml-auto font-mono text-[10px] text-gray-500">{selected.length} selected</span>
      </div>
      <ProtocolSelector selected={selected} onToggle={onToggle} />
      {selected.length > 0 && (
        <div className="space-y-2 pt-1">
          {selected.map((id) => (
            <ProtocolConfigurator
              key={id}
              protocolId={id}
              config={role.protocolConfig[id]}
              onChange={(cfg) => setRoleProtocolConfig(role.ref, id, cfg)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Read-only derived governance chips (D-A=C): bounds shown, not homework. */
function ChipRow({ label, values, mono }: { label: string; values: string[]; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-12 shrink-0 text-[10px] uppercase tracking-wider text-gray-600">{label}</span>
      <div className="flex flex-wrap gap-1">
        {values.length === 0 ? (
          <span className="text-[10px] text-gray-600">— none —</span>
        ) : values.map((v) => (
          <span key={v} className={`rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-gray-400${mono ? ' font-mono' : ''}`}>
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

function RoleCard({ role, allRoles }: { role: ComposerRole; allRoles: ComposerRole[] }) {
  const { updateRole, removeRole, setRoot, addDelegation, removeDelegation } = useComposerStore();
  const delegations = useComposerStore((s) => s.delegations);
  const parentEdge = delegations.find((d) => d.child === role.ref);
  const [customizing, setCustomizing] = useState(false);

  return (
    <GlassPanel className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          className="flex-1 rounded bg-white/5 px-2 py-1 text-sm font-semibold"
          value={role.name}
          onChange={(e) => updateRole(role.ref, { name: e.target.value })}
        />
        {role.root ? (
          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">ROOT</span>
        ) : (
          <button className="text-[10px] text-gray-500 hover:text-primary" onClick={() => setRoot(role.ref)}>
            make root
          </button>
        )}
        {!role.root && (
          <button onClick={() => removeRole(role.ref)} className="text-gray-500 hover:text-red-400">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <label className="space-y-1">
          <span className="text-gray-500">Role class</span>
          <input className="w-full rounded bg-white/5 px-2 py-1"
            value={role.role} onChange={(e) => updateRole(role.ref, { role: e.target.value })} />
        </label>
        <label className="space-y-1">
          <span className="text-gray-500">Delegated by (parent)</span>
          <select
            className="w-full rounded bg-white/5 px-2 py-1 disabled:opacity-40"
            disabled={role.root}
            value={parentEdge?.parent ?? ''}
            onChange={(e) => {
              if (parentEdge) removeDelegation(parentEdge.parent, role.ref);
              if (e.target.value) addDelegation(e.target.value, role.ref);
            }}
          >
            <option value="">— none —</option>
            {allRoles.filter((r) => r.ref !== role.ref).map((r) => (
              <option key={r.ref} value={r.ref}>{r.name}</option>
            ))}
          </select>
        </label>
      </div>

      {/* GOVERNANCE — derived bounds, shown not filled (D-A=C). Quiet status next
          to the dominant protocol surface. Identity/PoP/attenuation are ambient
          (never shown as fields); only the authored bounds appear, as chips. */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500">
            <Shield size={11} className="text-primary" /> Governance — derived, enforced by SYNTHERA
          </span>
          <button
            className="text-[10px] text-gray-500 hover:text-primary"
            onClick={() => setCustomizing((v) => !v)}
          >
            {customizing ? 'done' : 'customize'}
          </button>
        </div>

        {!customizing ? (
          <div className="mt-2 space-y-1.5">
            <ChipRow label="scope" values={role.scopeBoundary} mono />
            <ChipRow label="caps" values={role.capabilitySet} />
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            <label className="block space-y-1 text-xs">
              <span className="text-gray-500">Scope boundary (resource prefix only — no action verbs)</span>
              <input
                className="w-full rounded bg-white/5 px-2 py-1 font-mono"
                value={role.scopeBoundary.join(', ')}
                onChange={(e) => updateRole(role.ref, {
                  scopeBoundary: e.target.value.split(',').map((x) => x.trim()).filter(Boolean),
                })}
              />
            </label>
            <label className="block space-y-1 text-xs">
              <span className="text-gray-500">Capabilities</span>
              <input
                className="w-full rounded bg-white/5 px-2 py-1 font-mono"
                value={role.capabilitySet.join(', ')}
                onChange={(e) => updateRole(role.ref, {
                  capabilitySet: e.target.value.split(',').map((x) => x.trim()).filter(Boolean),
                })}
              />
            </label>
          </div>
        )}
      </div>

      {/* PROTOCOLS — the primary per-role surface (D-D=A). */}
      <RoleProtocols role={role} />
    </GlassPanel>
  );
}

function DelegationTree() {
  const roles = useComposerStore((s) => s.roles);
  const delegations = useComposerStore((s) => s.delegations);
  const root = roles.find((r) => r.root);

  const render = (ref: string, depth: number): React.ReactNode => {
    const role = roles.find((r) => r.ref === ref);
    if (!role) return null;
    const children = delegations.filter((d) => d.parent === ref);
    return (
      <div key={ref} style={{ marginLeft: depth * 16 }} className="text-xs">
        <span className="font-semibold text-primary">{role.name}</span>
        <span className="ml-2 font-mono text-[10px] text-gray-500">{role.scopeBoundary.join(' ')}</span>
        {children.map((c) => (
          <div key={c.child} className="border-l border-white/10 pl-2">
            <span className="text-[10px] text-gray-600">MAY spawn ↓</span>
            {render(c.child, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  return root ? render(root.ref, 0) : <p className="text-xs text-gray-500">No root role.</p>;
}

export function SystemComposerPage() {
  const state = useComposerStore();
  const { systemName, tenantId, roles, status, error, setSystemName, setTenantId, addRole, setStatus } = state;
  const errors = useMemo(() => composerErrors(state), [state]);
  const [provisionResult, setProvisionResult] = useState<unknown | null>(null);
  // Demo operator token is entered at runtime and kept in localStorage, never
  // baked into the public bundle (so viewing the hosted UI does not leak it).
  const [operatorToken, setOperatorToken] = useState<string>(
    () => localStorage.getItem('forgeOperatorToken') ?? '',
  );

  const provisionUrl = import.meta.env.VITE_FORGE_PROVISION_URL;

  const handleProvision = async () => {
    if (errors.length > 0) return;
    const spec = composerToSpec(state);
    setStatus('provisioning');
    try {
      if (!provisionUrl) {
        throw new Error('VITE_FORGE_PROVISION_URL not set — set it to provision against the live engine');
      }
      if (!operatorToken) {
        throw new Error('Enter the demo operator token below to provision.');
      }
      const result = await provisionSystem(provisionUrl, spec, operatorToken);
      setProvisionResult(result);
      setStatus('done', { result });
    } catch (e) {
      setStatus('error', { error: e instanceof Error ? e.message : String(e) });
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Governed System Composer
          </span>
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Compose which roles MAY spawn which children, attenuated. One tenant, one root, a delegation envelope.
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <label className="space-y-1 text-xs">
          <span className="text-gray-500">System name</span>
          <input className="w-full rounded bg-white/5 px-2 py-1" value={systemName}
            onChange={(e) => setSystemName(e.target.value)} />
        </label>
        <label className="space-y-1 text-xs">
          <span className="text-gray-500">Tenant (one tenant per system, D1)</span>
          <input className="w-full rounded bg-white/5 px-2 py-1 font-mono" value={tenantId}
            onChange={(e) => setTenantId(e.target.value)} />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* GOVERNANCE: roles + permitted delegation (the envelope) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
            <Shield size={15} className="text-primary" /> Governance — roles &amp; permitted delegation
          </div>
          {roles.map((r) => <RoleCard key={r.ref} role={r} allRoles={roles} />)}
          <NeonButton variant="ghost" onClick={addRole} icon={<Plus size={14} />}>Add role</NeonButton>
        </div>

        {/* Side: governance tree (distinct from runtime), validation, provision */}
        <div className="space-y-4">
          <GlassPanel>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-300">
              <Shield size={13} className="text-primary" /> Permitted delegation (envelope)
            </div>
            <DelegationTree />
          </GlassPanel>

          {/* Runtime kept VISIBLY DISTINCT from governance (D7) */}
          <GlassPanel>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-300">
              <Workflow size={13} className="text-secondary" /> Runtime handoffs (separate layer)
            </div>
            <p className="text-[11px] text-gray-500">
              Runtime message passing is a distinct layer from governance and is not a substrate
              operation. None composed in this demo.
            </p>
          </GlassPanel>

          <GlassPanel>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-300">
              Compose-time validation (schema D6)
            </div>
            {errors.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 size={14} /> Valid envelope — honorable by the engine.
              </div>
            ) : (
              <ul className="space-y-1.5">
                {errors.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11px] text-amber-400">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                    <span><span className="font-mono text-amber-300">{e.code}</span>: {e.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </GlassPanel>

          <label className="block space-y-1 text-xs">
            <span className="text-gray-500">Demo operator token (kept in your browser only)</span>
            <input
              type="password"
              className="w-full rounded bg-white/5 px-2 py-1 font-mono"
              value={operatorToken}
              placeholder="paste the demo operator token"
              onChange={(e) => {
                setOperatorToken(e.target.value);
                localStorage.setItem('forgeOperatorToken', e.target.value);
              }}
            />
          </label>

          <NeonButton
            onClick={handleProvision}
            disabled={errors.length > 0 || status === 'provisioning'}
            loading={status === 'provisioning'}
            icon={<Rocket size={14} />}
          >
            Provision system
          </NeonButton>

          {status === 'error' && (
            <p className="text-[11px] text-red-400">{error}</p>
          )}
          {status === 'done' && (
            <GlassPanel>
              <div className="text-xs font-semibold text-emerald-400">Provisioned ✓</div>
              <pre className="mt-2 overflow-auto text-[10px] text-gray-400">
                {JSON.stringify(provisionResult, null, 2)}
              </pre>
            </GlassPanel>
          )}
        </div>
      </div>
    </div>
  );
}
