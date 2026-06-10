/**
 * Bridge a single legacy UAB Agent to a GovernedSystemSpec (demo posture).
 *
 * Gate-2 scope: the current single-agent builder maps to a one-root system (the
 * agent IS the root). The full multi-role composition surface (root + permitted
 * workers + delegation envelope) is Phase 3; this is the minimal bridge so the
 * real BuilderPort adapter has a valid spec to provision today.
 *
 * scopeBoundary is templated per role as a resource prefix (D4) — derived from
 * tenant + agent ref, never an action verb. Protocol bindings ride along as the
 * opaque protocolConfig detail (M4).
 */

import type { Agent } from '../../domain/entities/agent.ts';
import { generateConfig } from '../../domain/services/config-generator.service.ts';
import { SPEC_VERSION, type GovernedSystemSpec } from './governed-system-spec.ts';

/** Templated resource-prefix scope for a role (D4: a noun prefix, never a verb). */
export function templateScope(tenantId: string, roleRef: string): string[] {
  return [`${tenantId}/${roleRef}/`];
}

export function agentToGovernedSystemSpec(
  agent: Agent,
  opts: { tenantId: string },
): GovernedSystemSpec {
  const ref = 'root';
  const generated = generateConfig(agent);
  return {
    specVersion: SPEC_VERSION,
    system: { id: agent.id, name: agent.name, description: agent.description },
    tenant: { id: opts.tenantId },
    agents: [
      {
        ref,
        role: agent.type,
        name: agent.name,
        prompt: agent.prompt,
        scopeBoundary: templateScope(opts.tenantId, ref),
        capabilitySet: [...agent.capabilities],
        root: true,
        protocolConfig: generated.protocols,
      },
    ],
    delegations: [],
  };
}
