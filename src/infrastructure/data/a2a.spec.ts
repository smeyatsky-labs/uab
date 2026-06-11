import type { ProtocolSpec } from '../../domain/protocols/protocol.types.ts';

export const a2aSpec: ProtocolSpec = {
  metadata: {
    id: 'a2a',
    name: 'Agent-to-Agent Protocol',
    shortName: 'A2A',
    version: '0.3.0',
    category: 'core-agent',
    description: 'Google/Linux Foundation standard for agent discovery via Agent Cards, task management, and multi-agent collaboration. Adopted by 150+ organizations.',
    maintainer: 'Google / Linux Foundation',
    website: 'https://google.github.io/A2A',
    color: '#3B82F6',
    icon: 'Network',
  },
  configSchema: {
    protocolId: 'a2a',
    groups: [
      {
        id: 'agent-card',
        label: 'Agent Card',
        description: 'Public agent discovery profile',
        fields: [
          { key: 'agentName', label: 'Agent Name', type: 'text', description: 'Public display name for discovery', defaultValue: '', required: true, placeholder: 'My Agent' },
          { key: 'agentDescription', label: 'Description', type: 'text', description: 'What this agent does', defaultValue: '', required: true, placeholder: 'Describe agent capabilities...' },
          { key: 'discoveryEndpoint', label: 'Discovery Endpoint', type: 'url', description: 'URL where Agent Card is published', defaultValue: '', required: false, placeholder: 'https://agent.example.com/.well-known/agent.json' },
        ],
      },
      {
        id: 'communication',
        label: 'Communication',
        fields: [
          { key: 'communicationPort', label: 'Communication Port', type: 'port', description: 'Port for agent-to-agent communication', defaultValue: 8080, required: true, min: 1024, max: 65535 },
          { key: 'streaming', label: 'Enable Streaming', type: 'boolean', description: 'Support streaming responses', defaultValue: true, required: false },
          { key: 'pushNotifications', label: 'Push Notifications', type: 'boolean', description: 'Enable push notification delivery', defaultValue: false, required: false },
        ],
      },
      {
        id: 'security',
        label: 'Security',
        fields: [
          { key: 'authType', label: 'Authentication', type: 'select', description: 'Authentication method for incoming requests', defaultValue: 'api-key', required: true, options: [{ label: 'None', value: 'none' }, { label: 'API Key', value: 'api-key' }, { label: 'OAuth 2.0', value: 'oauth2' }, { label: 'JWT', value: 'jwt' }] },
          { key: 'securityLevel', label: 'Security Level', type: 'select', description: 'Overall security posture', defaultValue: 'enhanced', required: true, options: [{ label: 'Basic', value: 'basic' }, { label: 'Enhanced', value: 'enhanced' }, { label: 'Strict', value: 'strict' }] },
          { key: 'maxConcurrentTasks', label: 'Max Concurrent Tasks', type: 'number', description: 'Maximum parallel task handling', defaultValue: 5, required: false, min: 1, max: 100 },
        ],
      },
    ],
  },
  compatibility: {
    protocolId: 'a2a',
    compatibleWith: ['mcp', 'adk', 'toon', 'visa-tap', 'ag-ui'],
    requiredBy: [],
    enhancedBy: ['mcp', 'toon'],
  },
  defaultConfig: { agentName: '', agentDescription: '', communicationPort: 8080, streaming: true, pushNotifications: false, authType: 'api-key', securityLevel: 'enhanced', maxConcurrentTasks: 5 },
  exampleConfig: { agentName: 'Commerce Assistant', agentDescription: 'Multi-vendor shopping agent with real-time price comparison', discoveryEndpoint: 'https://commerce-agent.example.com/.well-known/agent.json', communicationPort: 9090, streaming: true, pushNotifications: true, authType: 'oauth2', securityLevel: 'strict', maxConcurrentTasks: 20 },
  protocolFeatures: ['Agent Discovery', 'Agent Cards', 'Task Management', 'Multi-Agent Collaboration', 'Streaming Responses', 'Push Notifications'],
  useCases: ['Multi-agent orchestration', 'Agent marketplace discovery', 'Delegated task execution', 'Cross-organization collaboration'],
};
