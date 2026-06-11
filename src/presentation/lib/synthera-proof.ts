/**
 * "SYNTHERA under everything" proof helpers (Phase 4).
 *
 * Pure functions behind the demo proof: the governed snapshot of a role (what the
 * substrate mints and enforces) and the diff between two snapshots. The proof is
 * that toggling a role's PROTOCOLS leaves its GOVERNED snapshot byte-identical —
 * governanceDiff(before, after) === [] under any protocol change. Kept pure so the
 * orthogonality is unit-tested, not just asserted in the UI.
 */

import type { ComposerRole } from '../store/system-composer.store.ts';
import type { DelegationEdge } from '../../infrastructure/contract/governed-system-spec.ts';

/** The governed identity of a role — everything the substrate mints/enforces. */
export interface GovernedSnapshot {
  readonly ref: string;
  readonly role: string;          // -> agent_class (identity kind)
  readonly scopeBoundary: string[];
  readonly capabilitySet: string[];
  readonly root: boolean;
  readonly parent: string | null; // lineage (single-parent)
}

export function governedSnapshot(role: ComposerRole, delegations: DelegationEdge[]): GovernedSnapshot {
  const edge = delegations.find((d) => d.child === role.ref);
  return {
    ref: role.ref,
    role: role.role,
    scopeBoundary: [...role.scopeBoundary],
    capabilitySet: [...role.capabilitySet],
    root: role.root,
    parent: edge ? edge.parent : null,
  };
}

/** The protocol surface of a role — what it SPEAKS. Volatile by design. */
export function protocolSurface(role: ComposerRole): string[] {
  return Object.keys(role.protocolConfig).sort();
}

export interface FieldDiff {
  readonly field: keyof GovernedSnapshot;
  readonly before: unknown;
  readonly after: unknown;
}

/** Fields that differ between two governed snapshots. Empty === governance unmoved. */
export function governanceDiff(before: GovernedSnapshot, after: GovernedSnapshot): FieldDiff[] {
  const fields: (keyof GovernedSnapshot)[] = ['ref', 'role', 'scopeBoundary', 'capabilitySet', 'root', 'parent'];
  const diffs: FieldDiff[] = [];
  for (const f of fields) {
    if (JSON.stringify(before[f]) !== JSON.stringify(after[f])) {
      diffs.push({ field: f, before: before[f], after: after[f] });
    }
  }
  return diffs;
}
