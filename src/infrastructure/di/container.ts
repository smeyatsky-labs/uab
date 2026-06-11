/**
 * Dependency Injection Container
 * Plain factory function wiring all ports to adapters.
 * No DI framework — just a composition root.
 *
 * Note: the legacy single-agent BuilderPort (mint via an Agent->spec bridge) was
 * removed with LEAK-1. The composer (SystemComposerPage) provisions by calling
 * provisionSystem() directly with a composed GovernedSystemSpec, so there is no
 * builder port in the container.
 */

import type { AgentRepoPort } from '../../domain/ports/agent-repo.port.ts';
import type { ProtocolRegistryPort } from '../../domain/ports/protocol-registry.port.ts';
import type { MetricsPort } from '../../domain/ports/metrics.port.ts';
import type { CommercePort } from '../../domain/ports/commerce.port.ts';

import { LocalStorageAgentRepo } from '../adapters/local-storage-agent.repo.ts';
import { InMemoryProtocolRegistry } from '../adapters/inmemory-protocol-registry.ts';
import { MockMetricsService } from '../mock/mock-metrics.service.ts';
import { MockCommerceService } from '../mock/mock-commerce.service.ts';

export interface Container {
  agentRepo: AgentRepoPort;
  protocolRegistry: ProtocolRegistryPort;
  metrics: MetricsPort;
  commerce: CommercePort;
}

let instance: Container | null = null;

export function createContainer(): Container {
  if (instance) return instance;

  instance = {
    agentRepo: new LocalStorageAgentRepo(),
    protocolRegistry: new InMemoryProtocolRegistry(),
    metrics: new MockMetricsService(),
    commerce: new MockCommerceService(),
  };

  return instance;
}

export function getContainer(): Container {
  if (!instance) return createContainer();
  return instance;
}
