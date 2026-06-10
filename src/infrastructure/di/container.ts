/**
 * Dependency Injection Container
 * Plain factory function wiring all ports to adapters.
 * No DI framework — just a composition root.
 */

import type { AgentRepoPort } from '../../domain/ports/agent-repo.port.ts';
import type { ProtocolRegistryPort } from '../../domain/ports/protocol-registry.port.ts';
import type { BuilderPort } from '../../domain/ports/builder.port.ts';
import type { MetricsPort } from '../../domain/ports/metrics.port.ts';
import type { CommercePort } from '../../domain/ports/commerce.port.ts';

import { LocalStorageAgentRepo } from '../adapters/local-storage-agent.repo.ts';
import { InMemoryProtocolRegistry } from '../adapters/inmemory-protocol-registry.ts';
import { MockBuilderService } from '../mock/mock-builder.service.ts';
import { ForgeProvisioningBuilderService } from '../adapters/forge-provisioning-builder.service.ts';
import { MockMetricsService } from '../mock/mock-metrics.service.ts';
import { MockCommerceService } from '../mock/mock-commerce.service.ts';

/**
 * Select the BuilderPort implementation. When VITE_FORGE_PROVISION_URL is set,
 * use the real forge-agents provisioning engine (demo/single-operator posture);
 * otherwise fall back to the mock so offline dev keeps working.
 */
function createBuilder(): BuilderPort {
  const url = import.meta.env.VITE_FORGE_PROVISION_URL;
  if (url) {
    const tenant = import.meta.env.VITE_FORGE_TENANT_ID ?? 'demo-tenant';
    return new ForgeProvisioningBuilderService(url, tenant);
  }
  return new MockBuilderService();
}

export interface Container {
  agentRepo: AgentRepoPort;
  protocolRegistry: ProtocolRegistryPort;
  builder: BuilderPort;
  metrics: MetricsPort;
  commerce: CommercePort;
}

let instance: Container | null = null;

export function createContainer(): Container {
  if (instance) return instance;

  instance = {
    agentRepo: new LocalStorageAgentRepo(),
    protocolRegistry: new InMemoryProtocolRegistry(),
    builder: createBuilder(),
    metrics: new MockMetricsService(),
    commerce: new MockCommerceService(),
  };

  return instance;
}

export function getContainer(): Container {
  if (!instance) return createContainer();
  return instance;
}
