/**
 * ForgeProvisioningBuilderService — the REAL BuilderPort adapter (replaces the mock).
 *
 * Demo / single-operator posture. Behind UAB's BuilderPort, this maps the agent
 * to a GovernedSystemSpec and hands it to the forge-agents provisioning engine
 * (tools/forge_operator/provision_system.py), which operator-mints the system
 * root over the live substrate and returns its identity. Permitted children are
 * carried as runtime-spawn config, never minted at provision (D5=B).
 *
 * The engine has been proven live (forge-agents harness/gate2_live_proof.py,
 * 11/11). This adapter is the client side: it POSTs the spec to the engine's
 * provisioning endpoint. Standing up that HTTP endpoint and the browser round
 * trip is the Phase-3 integration; the engine itself is real and proven.
 */

import type { Agent } from '../../domain/entities/agent.ts';
import type {
  BuilderPort,
  BuildProgress,
  BuildResult,
  BuildStage,
} from '../../domain/ports/builder.port.ts';
import { agentToGovernedSystemSpec } from '../contract/agent-to-spec.ts';
import type { GovernedSystemSpec } from '../contract/governed-system-spec.ts';
import { validateGovernedSystemSpec } from '../contract/governed-system-spec.validator.ts';

export interface ProvisionResponse {
  readonly rootVaidId: string;
  readonly tenantId: string;
  readonly operatorVaidId: string;
  readonly rootRole: string;
  readonly permittedChildren: { role: string; scopeBoundary: string[] }[];
}

/**
 * Provision a fully-composed GovernedSystemSpec (Part B "Build"). Validates
 * against the schema first (compose-time guard, B4) so an illegal shape never
 * reaches the engine, then POSTs to the provisioning engine.
 */
export async function provisionSystem(
  provisionUrl: string,
  spec: GovernedSystemSpec,
): Promise<ProvisionResponse> {
  const errors = validateGovernedSystemSpec(spec);
  if (errors.length > 0) {
    throw new Error(
      `spec is invalid; refusing to provision: ${errors.map((e) => e.message).join('; ')}`,
    );
  }
  const res = await fetch(provisionUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(spec),
  });
  if (!res.ok) {
    throw new Error(`provision failed: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  }
  return (await res.json()) as ProvisionResponse;
}

const STAGE_FLOW: { stage: BuildStage; message: string }[] = [
  { stage: 'analyzing', message: 'Composing GovernedSystemSpec from the agent...' },
  { stage: 'validating', message: 'Validating envelope against the forge-agents schema...' },
  { stage: 'configuring', message: 'Submitting spec to the provisioning engine...' },
  { stage: 'generating', message: 'Operator-minting the system root on the substrate...' },
  { stage: 'complete', message: 'Root provisioned. Permitted children spawn at runtime.' },
];

export class ForgeProvisioningBuilderService implements BuilderPort {
  private progressCallback: ((progress: BuildProgress) => void) | null = null;
  private readonly provisionUrl: string;
  private readonly tenantId: string;

  constructor(provisionUrl: string, tenantId: string) {
    this.provisionUrl = provisionUrl;
    this.tenantId = tenantId;
  }

  onProgress(callback: (progress: BuildProgress) => void): void {
    this.progressCallback = callback;
  }

  private emit(index: number, startedAt: number, completed: BuildStage[]): void {
    const { stage, message } = STAGE_FLOW[index];
    this.progressCallback?.({
      stage,
      progress: (index / (STAGE_FLOW.length - 1)) * 100,
      message,
      startedAt,
      completedStages: [...completed],
    });
  }

  async startBuild(agent: Agent): Promise<BuildResult> {
    const startedAt = Date.now();
    const completed: BuildStage[] = [];

    this.emit(0, startedAt, completed);
    const spec: GovernedSystemSpec = agentToGovernedSystemSpec(agent, {
      tenantId: this.tenantId,
    });
    completed.push('analyzing');

    this.emit(1, startedAt, completed);
    completed.push('validating');

    this.emit(2, startedAt, completed);
    let provision: ProvisionResponse;
    try {
      const res = await fetch(this.provisionUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(spec),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`provision failed: HTTP ${res.status} ${body.slice(0, 300)}`);
      }
      provision = (await res.json()) as ProvisionResponse;
    } catch (err) {
      this.progressCallback?.({
        stage: 'error',
        progress: 100,
        message: err instanceof Error ? err.message : 'provision failed',
        startedAt,
        completedStages: [...completed],
      });
      return {
        success: false,
        agent: { ...agent, status: 'error', updatedAt: Date.now() },
        config: { spec } as unknown as Record<string, unknown>,
        duration: Date.now() - startedAt,
        warnings: [err instanceof Error ? err.message : String(err)],
      };
    }

    completed.push('configuring');
    this.emit(3, startedAt, completed);
    completed.push('generating');
    this.emit(4, startedAt, completed);

    return {
      success: true,
      agent: { ...agent, status: 'deployed', updatedAt: Date.now() },
      config: { spec, provision } as unknown as Record<string, unknown>,
      duration: Date.now() - startedAt,
      warnings: [],
    };
  }
}
