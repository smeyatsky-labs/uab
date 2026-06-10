/**
 * Compose-time validator for GovernedSystemSpec (D6, B4 — the airtight guard).
 *
 * Mirrors the forge-agents-owned Pydantic schema (apps/api/src/agent_systems)
 * bit-for-bit so an illegal shape is rejected IN THE UI, before it ever reaches
 * the engine. The attenuation predicates mirror synthera (proven == substrate at
 * Gate 2); the structural rules mirror the GovernedSystemSpec model_validator.
 *
 * This is defense-in-depth, not the sole authority: the engine re-validates with
 * the canonical Pydantic schema before any mint. But the UI must not let a user
 * compose a system the engine can't honor (no checks the engine can't cash).
 */

import type { GovernedSystemSpec } from './governed-system-spec.ts';

const ACTION_VERBS = new Set([
  'get', 'post', 'put', 'patch', 'delete', 'read', 'write',
  'list', 'create', 'update', 'remove', 'execute', 'exec',
]);

/** Mirror of synthera Vaid::is_in_scope (vaid.rs:188-195). Empty = unrestricted. */
export function isInScope(scopeBoundary: string[], resource: string): boolean {
  if (scopeBoundary.length === 0) return true;
  return scopeBoundary.some((prefix) => resource.startsWith(prefix));
}

/** Mirror of synthera scope_attenuates (mint_vaid.rs:47-54). */
export function scopeAttenuates(parentScope: string[], childScope: string[]): boolean {
  if (childScope.length === 0) return parentScope.length === 0;
  return childScope.every((entry) => isInScope(parentScope, entry));
}

/** Mirror of synthera caps_attenuate (mint_vaid.rs:56-68). */
export function capsAttenuate(parentCaps: string[], childCaps: string[]): boolean {
  const parent = new Set(parentCaps);
  return childCaps.every((cap) => parent.has(cap));
}

/** D4 guard: a scope entry must be a resource prefix, never an action verb. */
export function isActionVerbScope(entry: string): boolean {
  if (entry.includes(':') || /\s/.test(entry)) return true;
  const firstSegment = entry.replace(/\//g, '.').split('.', 1)[0].trim().toLowerCase();
  return ACTION_VERBS.has(firstSegment);
}

export interface ValidationError {
  readonly code: string;
  readonly message: string;
  /** Agent ref or edge the error concerns, for inline UI highlighting. */
  readonly subject?: string;
}

/**
 * Validate a composed spec. Returns [] when valid; otherwise one error per
 * violated rule. Order mirrors the Pydantic model_validator so messages match.
 */
export function validateGovernedSystemSpec(spec: GovernedSystemSpec): ValidationError[] {
  const errors: ValidationError[] = [];
  const byRef = new Map<string, GovernedSystemSpec['agents'][number]>();

  for (const agent of spec.agents) {
    if (byRef.has(agent.ref)) {
      errors.push({ code: 'duplicate-ref', message: `duplicate agent ref '${agent.ref}'`, subject: agent.ref });
    }
    byRef.set(agent.ref, agent);
  }

  // D4: resource-prefix-only scope, no action verbs.
  for (const agent of spec.agents) {
    for (const entry of agent.scopeBoundary) {
      if (isActionVerbScope(entry)) {
        errors.push({
          code: 'action-verb-scope',
          message: `agent '${agent.ref}' scope entry '${entry}' looks like an action verb; scope is resource-prefix-only (D4)`,
          subject: agent.ref,
        });
      }
    }
  }

  // D1/D3: exactly one root.
  const roots = spec.agents.filter((a) => a.root).map((a) => a.ref);
  if (roots.length !== 1) {
    errors.push({ code: 'root-cardinality', message: `exactly one root agent required (D1/D3); found ${roots.length}: ${JSON.stringify(roots)}` });
  }
  const rootRef = roots[0];

  // Edges reference known roles; no self-delegation.
  for (const edge of spec.delegations) {
    if (!byRef.has(edge.parent)) {
      errors.push({ code: 'unknown-parent', message: `delegation parent '${edge.parent}' is not a known agent ref`, subject: edge.parent });
    }
    if (!byRef.has(edge.child)) {
      errors.push({ code: 'unknown-child', message: `delegation child '${edge.child}' is not a known agent ref`, subject: edge.child });
    }
    if (edge.parent === edge.child) {
      errors.push({ code: 'self-delegation', message: `agent '${edge.parent}' cannot delegate to itself`, subject: edge.parent });
    }
  }

  // Single-parent lineage; root is no one's child.
  const parentOf = new Map<string, string>();
  for (const edge of spec.delegations) {
    if (edge.child === rootRef) {
      errors.push({ code: 'root-is-child', message: `root agent '${rootRef}' cannot be a delegation child`, subject: rootRef });
    }
    if (parentOf.has(edge.child)) {
      errors.push({
        code: 'multi-parent',
        message: `agent '${edge.child}' has multiple delegation parents ('${parentOf.get(edge.child)}' and '${edge.parent}'); lineage is single-parent`,
        subject: edge.child,
      });
    }
    parentOf.set(edge.child, edge.parent);
  }

  if (rootRef !== undefined) {
    const nonRoot = spec.agents.filter((a) => a.ref !== rootRef).map((a) => a.ref);
    const unrooted = nonRoot.filter((ref) => !parentOf.has(ref));
    if (unrooted.length > 0) {
      errors.push({ code: 'unrooted', message: `agents ${JSON.stringify(unrooted)} have no delegation parent; the graph must be a single-rooted tree` });
    }

    // Acyclic + connected: every non-root chains back to the root.
    for (const start of nonRoot) {
      const seen = new Set<string>();
      let cursor: string | undefined = start;
      while (cursor !== undefined && cursor !== rootRef) {
        if (seen.has(cursor)) {
          errors.push({ code: 'cycle', message: `delegation cycle detected involving '${cursor}'`, subject: cursor });
          cursor = undefined;
          break;
        }
        seen.add(cursor);
        cursor = parentOf.get(cursor);
      }
    }
  }

  // Attenuation along every edge (mirrors substrate; rejected before mint).
  for (const edge of spec.delegations) {
    const parent = byRef.get(edge.parent);
    const child = byRef.get(edge.child);
    if (!parent || !child) continue;
    if (!scopeAttenuates(parent.scopeBoundary, child.scopeBoundary)) {
      errors.push({
        code: 'scope-not-attenuated',
        message: `child '${child.ref}' scope is broader than parent '${parent.ref}' (each child prefix must sit within a parent prefix; empty child scope only under an empty parent)`,
        subject: child.ref,
      });
    }
    if (!capsAttenuate(parent.capabilitySet, child.capabilitySet)) {
      errors.push({
        code: 'caps-not-attenuated',
        message: `child '${child.ref}' capabilitySet exceeds parent '${parent.ref}'; every child capability must be held by the parent`,
        subject: child.ref,
      });
    }
  }

  return errors;
}

export function isValidSpec(spec: GovernedSystemSpec): boolean {
  return validateGovernedSystemSpec(spec).length === 0;
}
