/**
 * Forge provisioning client — the live composer provisioning call.
 *
 * Demo / single-operator posture. The Governed System Composer composes a
 * GovernedSystemSpec and hands it to the forge-agents provisioning engine
 * (tools/forge_operator/provision_system.py), which operator-mints the system
 * root over the live substrate and returns its identity. Permitted children are
 * carried as runtime-spawn config, never minted at provision (D5=B).
 *
 * This module is the client side: it POSTs the composed spec to the engine's
 * provisioning endpoint. The composer (SystemComposerPage) is the single builder
 * path; it calls provisionSystem() directly with composerToSpec(state). The
 * legacy single-agent BuilderPort path (and its Agent->spec bridge) was removed
 * with LEAK-1 so no free-text/UI surface can source a governed field.
 */

import type { GovernedSystemSpec } from '../contract/governed-system-spec.ts';
import { validateGovernedSystemSpec } from '../contract/governed-system-spec.validator.ts';

export interface ProvisionResponse {
  readonly status: string;
  readonly rootVaidId: string;
  readonly tenantId: string;
  readonly operatorVaidId: string;
  readonly rootRole: string;
  readonly permittedChildren: { role: string; scopeBoundary: string[] }[];
  readonly agentUrl?: string;
}

/**
 * Provision a fully-composed GovernedSystemSpec (Part B "Build"). Validates
 * against the schema first (compose-time guard, B4) so an illegal shape never
 * reaches the engine, then POSTs to the provisioning engine.
 */
export async function provisionSystem(
  provisionUrl: string,
  spec: GovernedSystemSpec,
  token?: string,
): Promise<ProvisionResponse> {
  // Browser-side validation is UX. The server re-validates and is the real gate;
  // we still pre-check here to give immediate feedback before the round trip.
  const errors = validateGovernedSystemSpec(spec);
  if (errors.length > 0) {
    throw new Error(
      `spec is invalid; refusing to provision: ${errors.map((e) => e.message).join('; ')}`,
    );
  }
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(provisionUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(spec),
  });
  if (!res.ok) {
    const body = await res.text();
    // Surface the SERVER-side rejection (422 from the canonical schema) verbatim.
    throw new Error(`provision rejected by server: HTTP ${res.status} ${body.slice(0, 400)}`);
  }
  return (await res.json()) as ProvisionResponse;
}
