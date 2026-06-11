import type { ProtocolSpec } from '../../domain/protocols/protocol.types.ts';

export const toonSpec: ProtocolSpec = {
  metadata: {
    id: 'toon',
    name: 'Smart Contract Negotiation',
    shortName: 'TOON',
    version: '0.4.0',
    category: 'orchestration',
    description: 'Agent-to-agent contract negotiation protocol with configurable budget, latency, trust, and SLA terms. Enables autonomous multi-party agreements.',
    maintainer: 'TOON Foundation',
    website: 'https://toon-protocol.org',
    color: '#14B8A6',
    icon: 'FileSignature',
  },
  configSchema: {
    protocolId: 'toon',
    groups: [
      {
        id: 'strategy',
        label: 'Negotiation Strategy',
        fields: [
          { key: 'autoNegotiate', label: 'Auto-Negotiate', type: 'boolean', description: 'Allow autonomous negotiation', defaultValue: false, required: false },
          { key: 'maxRounds', label: 'Max Rounds', type: 'slider', description: 'Maximum negotiation rounds', defaultValue: 5, required: false, min: 1, max: 20, step: 1 },
          { key: 'concessionRate', label: 'Concession Rate', type: 'slider', description: 'How much to concede per round (0-1)', defaultValue: 0.1, required: false, min: 0, max: 1, step: 0.05 },
          { key: 'walkAwayThreshold', label: 'Walk-Away Threshold', type: 'slider', description: 'Minimum acceptable deal quality (0-1)', defaultValue: 0.6, required: false, min: 0, max: 1, step: 0.05 },
        ],
      },
      {
        id: 'terms',
        label: 'Default Terms',
        fields: [
          { key: 'defaultBudget', label: 'Default Budget ($)', type: 'number', description: 'Default budget for contracts', defaultValue: 100, required: false, min: 1, max: 1000000 },
          { key: 'defaultLatencyMs', label: 'Target Latency (ms)', type: 'slider', description: 'Target response latency', defaultValue: 200, required: false, min: 10, max: 5000, step: 10 },
          { key: 'defaultSlaUptime', label: 'SLA Uptime (%)', type: 'slider', description: 'Required uptime percentage', defaultValue: 99.5, required: false, min: 90, max: 99.99, step: 0.1 },
        ],
      },
      {
        id: 'trust',
        label: 'Trust & Arbitration',
        fields: [
          { key: 'trustedParties', label: 'Trusted Parties', type: 'tags', description: 'Pre-approved negotiation partners', defaultValue: [], required: false, placeholder: 'Add agent ID...' },
          { key: 'arbitrationEnabled', label: 'Arbitration', type: 'boolean', description: 'Enable third-party arbitration for disputes', defaultValue: true, required: false },
        ],
      },
    ],
  },
  compatibility: {
    protocolId: 'toon',
    compatibleWith: ['a2a', 'ap2', 'visa-tap'],
    requiredBy: [],
    enhancedBy: ['visa-tap', 'ap2'],
  },
  defaultConfig: { autoNegotiate: false, maxRounds: 5, concessionRate: 0.1, walkAwayThreshold: 0.6, defaultBudget: 100, defaultLatencyMs: 200, defaultSlaUptime: 99.5, trustedParties: [], arbitrationEnabled: true },
  exampleConfig: { autoNegotiate: true, maxRounds: 10, concessionRate: 0.15, walkAwayThreshold: 0.7, defaultBudget: 5000, defaultLatencyMs: 100, defaultSlaUptime: 99.95, trustedParties: ['agent_001', 'agent_002'], arbitrationEnabled: true },
  protocolFeatures: ['Multi-Party Negotiation', 'Budget Terms', 'Latency SLAs', 'Trust Scoring', 'Contract Templates', 'Dispute Arbitration'],
  useCases: ['Agent service agreements', 'SLA negotiation', 'Multi-agent task bidding', 'Resource allocation contracts'],
};
