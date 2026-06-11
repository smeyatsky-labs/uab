/**
 * Protocol Foundation Types
 *
 * Architectural Intent:
 * - Core type definitions for the 2026 agentic protocol stack
 * - All 10 protocols share common base types defined here
 * - Protocol-specific types extend these foundations
 * - ZERO framework dependencies — pure TypeScript
 */

export type ProtocolId =
  | 'mcp'
  | 'a2a'
  | 'adk'
  | 'acp'
  | 'ucp'
  | 'ap2'
  | 'visa-tap'
  | 'a2ui'
  | 'ag-ui'
  | 'toon';

export type ProtocolCategory =
  | 'core-agent'
  | 'commerce'
  | 'payments'
  | 'trust-security'
  | 'ui-interaction'
  | 'orchestration';

export interface ProtocolMetadata {
  readonly id: ProtocolId;
  readonly name: string;
  readonly shortName: string;
  readonly version: string;
  readonly category: ProtocolCategory;
  readonly description: string;
  readonly maintainer: string;
  readonly website: string;
  readonly color: string;
  readonly icon: string;
}

export type ConfigFieldType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multi-select'
  | 'slider'
  | 'json'
  | 'url'
  | 'port'
  | 'tags';

export interface ConfigFieldOption {
  readonly label: string;
  readonly value: string;
  readonly description?: string;
}

export interface ConfigField {
  readonly key: string;
  readonly label: string;
  readonly type: ConfigFieldType;
  readonly description: string;
  readonly defaultValue: unknown;
  readonly required: boolean;
  readonly group?: string;
  readonly options?: readonly ConfigFieldOption[];
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly placeholder?: string;
  readonly validation?: {
    readonly pattern?: string;
    readonly message?: string;
  };
}

export interface ConfigFieldGroup {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly fields: readonly ConfigField[];
}

export interface ProtocolConfigSchema {
  readonly protocolId: ProtocolId;
  readonly groups: readonly ConfigFieldGroup[];
}

export interface ProtocolCompatibility {
  readonly protocolId: ProtocolId;
  readonly compatibleWith: readonly ProtocolId[];
  readonly requiredBy: readonly ProtocolId[];
  readonly enhancedBy: readonly ProtocolId[];
}

export interface ProtocolSpec {
  readonly metadata: ProtocolMetadata;
  readonly configSchema: ProtocolConfigSchema;
  readonly compatibility: ProtocolCompatibility;
  readonly defaultConfig: Record<string, unknown>;
  readonly exampleConfig: Record<string, unknown>;
  /**
   * What this protocol can DO (descriptive feature list, e.g. "Tool Invocation").
   * NOT the governed capabilitySet. Renamed from `capabilities` (LEAK-2 wall-off):
   * the word "capabilities" must never name a non-governed surface that could be
   * mistaken for, or sourced into, the governance capabilitySet. Protocol features
   * are opaque runtime descriptors; they never confer authority.
   */
  readonly protocolFeatures: readonly string[];
  readonly useCases: readonly string[];
}

export interface AgentProtocolBinding {
  readonly protocolId: ProtocolId;
  readonly enabled: boolean;
  readonly config: Record<string, unknown>;
  readonly version: string;
}

export interface ProtocolRecommendation {
  readonly protocolId: ProtocolId;
  readonly confidence: number;
  readonly reason: string;
}

export interface ProtocolStatusInfo {
  readonly protocolId: ProtocolId;
  readonly status: 'active' | 'degraded' | 'inactive';
  readonly latency: number;
  readonly uptime: number;
  readonly lastChecked: number;
}
