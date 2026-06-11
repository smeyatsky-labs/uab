/**
 * SyntheraProofPanel (Phase 4) — "SYNTHERA under everything", made visible.
 *
 * Two panels side by side:
 *  - VOLATILE: the selected role's protocols (the builder changes these freely).
 *  - INVARIANT: the same role's GOVERNED snapshot (identity/agent_class, place in
 *    the delegation tree, attenuated scope/caps) that SYNTHERA mints + enforces.
 * Pin a baseline, then toggle protocols on the role above: the governance diff
 * stays ∅. Protocols moved; governance did not. That empty diff is the proof.
 *
 * Over-envelope denial: we surface the REAL compose-time attenuation guard (the
 * same predicate the substrate runs, scope_attenuates / mint_vaid.rs) and, when a
 * demo operator token is present, the REAL live-engine canonical-schema rejection
 * (server 422). NEITHER is a mock. Honesty note (see panel): the substrate's
 * mint-time denial proper is a runtime event in the deployed agent's spawn
 * (gate2-proven) and has no browser surface; what is shown here are its two real,
 * browser-reachable mirrors.
 */

import { useMemo, useState } from 'react';
import { Boxes, Shield, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { GlassPanel } from '../ui/GlassPanel.tsx';
import { NeonButton } from '../ui/NeonButton.tsx';
import { useComposerStore, type ComposerRole } from '../../store/system-composer.store.ts';
import {
  governedSnapshot,
  protocolSurface,
  governanceDiff,
  type GovernedSnapshot,
} from '../../lib/synthera-proof.ts';
import { validateGovernedSystemSpec } from '../../../infrastructure/contract/governed-system-spec.validator.ts';
import { SPEC_VERSION, type GovernedSystemSpec } from '../../../infrastructure/contract/governed-system-spec.ts';

function snapshotRows(s: GovernedSnapshot): [string, string][] {
  return [
    ['identity (agent_class)', s.role],
    ['root', String(s.root)],
    ['parent (lineage)', s.parent ?? '— (root)'],
    ['scope', s.scopeBoundary.join(' ') || '— unrestricted —'],
    ['caps', s.capabilitySet.join(' ') || '— none —'],
  ];
}

/** Build a spec where `child` escapes `parent`'s scope — the over-envelope case. */
function overEnvelopeSpec(role: ComposerRole, tenantId: string): GovernedSystemSpec {
  const parent: ComposerRole = { ...role, ref: 'over-parent', root: true };
  const escaped = `${tenantId}/__ESCAPED__/`;
  return {
    specVersion: SPEC_VERSION,
    system: { id: 'over', name: 'over-envelope probe' },
    tenant: { id: tenantId },
    agents: [
      { ref: parent.ref, role: parent.role, name: parent.name, scopeBoundary: parent.scopeBoundary, capabilitySet: parent.capabilitySet, root: true },
      { ref: 'over-child', role: 'bypass-probe', name: 'Over-envelope child', scopeBoundary: [escaped], capabilitySet: parent.capabilitySet, root: false },
    ],
    delegations: [{ parent: parent.ref, child: 'over-child' }],
  };
}

export function SyntheraProofPanel() {
  const roles = useComposerStore((s) => s.roles);
  const delegations = useComposerStore((s) => s.delegations);
  const tenantId = useComposerStore((s) => s.tenantId);

  const [selectedRef, setSelectedRef] = useState<string>(roles[0]?.ref ?? '');
  const role = roles.find((r) => r.ref === selectedRef) ?? roles[0];

  const [baseline, setBaseline] = useState<GovernedSnapshot | null>(null);
  const [engineResult, setEngineResult] = useState<string | null>(null);
  const [engineBusy, setEngineBusy] = useState(false);

  const current = useMemo(
    () => (role ? governedSnapshot(role, delegations) : null),
    [role, delegations],
  );
  const protocols = role ? protocolSurface(role) : [];
  const diff = baseline && current ? governanceDiff(baseline, current) : null;

  // REAL compose-time attenuation guard (the substrate-mirror predicate).
  const composeGuard = useMemo(() => {
    if (!role) return [];
    return validateGovernedSystemSpec(overEnvelopeSpec(role, tenantId))
      .filter((e) => e.code === 'scope-not-attenuated');
  }, [role, tenantId]);

  const verifyAgainstLiveEngine = async () => {
    if (!role) return;
    const url = import.meta.env.VITE_FORGE_PROVISION_URL;
    const token = localStorage.getItem('forgeOperatorToken') ?? '';
    if (!url) { setEngineResult('VITE_FORGE_PROVISION_URL not set — cannot reach the live engine.'); return; }
    if (!token) { setEngineResult('No demo operator token — enter it in the composer to call the live engine.'); return; }
    setEngineBusy(true);
    setEngineResult(null);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(overEnvelopeSpec(role, tenantId)),
      });
      const body = await res.text();
      setEngineResult(`HTTP ${res.status} — ${body.slice(0, 600)}`);
    } catch (e) {
      setEngineResult(e instanceof Error ? e.message : String(e));
    } finally {
      setEngineBusy(false);
    }
  };

  if (!role || !current) return null;

  return (
    <GlassPanel className="mt-6 space-y-4">
      <div className="flex items-center gap-2">
        <Shield size={16} className="text-primary" />
        <h2 className="text-sm font-semibold text-gray-100">SYNTHERA under everything — orthogonality proof</h2>
        <select
          className="ml-auto rounded bg-white/5 px-2 py-1 text-xs"
          value={selectedRef}
          onChange={(e) => { setSelectedRef(e.target.value); setBaseline(null); setEngineResult(null); }}
        >
          {roles.map((r) => <option key={r.ref} value={r.ref}>{r.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* VOLATILE */}
        <div className="rounded-lg border border-secondary/30 bg-secondary/[0.04] p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
            <Boxes size={14} /> Protocols — you choose (volatile)
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Toggle these on the role above. Change them all you like.</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {protocols.length === 0
              ? <span className="text-[11px] text-gray-600">— none selected —</span>
              : protocols.map((p) => (
                <span key={p} className="rounded-full border border-secondary/30 bg-secondary/10 px-2 py-0.5 text-[10px] font-mono text-secondary">{p}</span>
              ))}
          </div>
        </div>

        {/* INVARIANT */}
        <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Shield size={14} /> SYNTHERA — what it IS (invariant)
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Minted identity, place in the delegation tree, attenuated scope. Regardless of protocols.</p>
          <table className="mt-2 w-full text-[11px]">
            <tbody>
              {snapshotRows(current).map(([k, v]) => (
                <tr key={k}>
                  <td className="py-0.5 pr-2 align-top text-gray-500">{k}</td>
                  <td className="py-0.5 font-mono text-gray-300">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EMPTY-DIFF PROOF */}
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-200">Governance diff under protocol change</span>
          <NeonButton variant="ghost" onClick={() => setBaseline(current)}>Pin governance baseline</NeonButton>
        </div>
        {!baseline ? (
          <p className="mt-2 text-[11px] text-gray-500">
            Pin a baseline, then toggle protocols on the role above and watch this stay empty.
          </p>
        ) : diff && diff.length === 0 ? (
          <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 size={14} /> Governance diff: ∅ — protocols moved, governance did not.
          </div>
        ) : (
          <div className="mt-2 space-y-1">
            <p className="text-[11px] text-amber-400">Governance changed (you edited a governed field, not a protocol):</p>
            {diff?.map((d) => (
              <div key={d.field} className="font-mono text-[10px] text-amber-300">
                {d.field}: {JSON.stringify(d.before)} → {JSON.stringify(d.after)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* OVER-ENVELOPE DENIAL (real mirrors; see honesty note) */}
      <div className="rounded-lg border border-red-500/20 bg-red-500/[0.03] p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-red-300">
          <ShieldAlert size={14} /> Over-envelope spawn — denied (least-privilege attenuation)
        </div>

        <div className="mt-2 text-[11px]">
          <div className="text-gray-400">Compose-time guard (UAB) — the substrate&apos;s own attenuation predicate (mirror of mint_vaid.rs scope_attenuates):</div>
          {composeGuard.length > 0 ? (
            composeGuard.map((e, i) => (
              <div key={i} className="mt-1 rounded bg-red-500/10 px-2 py-1 font-mono text-[10px] text-red-300">
                DENIED [{e.code}]: {e.message}
              </div>
            ))
          ) : (
            <div className="mt-1 text-[10px] text-gray-500">
              (Selected role’s scope is unrestricted — give it a scope prefix to see an escaping child denied.)
            </div>
          )}
        </div>

        <div className="mt-3">
          <NeonButton variant="ghost" onClick={verifyAgainstLiveEngine} loading={engineBusy}>
            Verify against the live engine
          </NeonButton>
          {engineResult && (
            <pre className="mt-2 overflow-auto rounded bg-black/30 p-2 text-[10px] text-gray-300">{engineResult}</pre>
          )}
          <p className="mt-2 text-[10px] text-gray-600">
            The live engine returns its real canonical-schema rejection (server 422), which mirrors the
            substrate attenuation rule. The substrate&apos;s mint-time denial proper (mint_vaid.rs) is a
            runtime event in the deployed agent&apos;s spawn — gate2-proven, no browser surface.
          </p>
        </div>
      </div>
    </GlassPanel>
  );
}
