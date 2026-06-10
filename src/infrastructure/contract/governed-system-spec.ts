/**
 * GovernedSystemSpec — vendored contract type (forge-agents owns the schema, D6).
 *
 * This mirrors the published JSON Schema artifact
 * (forge-agents docs/contracts/governed-system-spec.schema.json), generated from
 * the canonical Pydantic model. UAB targets and validates against that schema;
 * this hand-vendored type is the lightest single-source-of-truth binding (D6/1c).
 *
 * It declares a DELEGATION ENVELOPE, not a deployment manifest (D5): which roles
 * exist and which roles MAY spawn which children, under what attenuated scope.
 * `scopeBoundary` is resource-prefix only — never action verbs (D4).
 */

export interface SystemMeta {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
}

export interface TenantRef {
  readonly id: string;
}

export interface AgentRole {
  readonly ref: string;
  readonly role: string;
  readonly name: string;
  readonly prompt?: string;
  /** Resource-prefix scopes only (D4). No action verbs. */
  readonly scopeBoundary: string[];
  readonly capabilitySet: string[];
  readonly root?: boolean;
  /** The demoted 10-protocol catalog, opaque to the engine/substrate. */
  readonly protocolConfig?: Record<string, unknown>;
}

export interface DelegationEdge {
  readonly parent: string;
  readonly child: string;
}

export interface HandoffEdge {
  readonly from: string;
  readonly to: string;
  readonly protocol?: string;
  readonly config?: Record<string, unknown>;
}

export interface GovernedSystemSpec {
  readonly specVersion: string;
  readonly system: SystemMeta;
  readonly tenant: TenantRef;
  readonly agents: AgentRole[];
  readonly delegations: DelegationEdge[];
  readonly handoffs?: HandoffEdge[];
}

export const SPEC_VERSION = '1.0';
