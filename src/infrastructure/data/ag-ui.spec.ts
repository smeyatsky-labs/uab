import type { ProtocolSpec } from '../../domain/protocols/protocol.types.ts';

export const agUiSpec: ProtocolSpec = {
  metadata: {
    id: 'ag-ui',
    name: 'Agent-User Interaction Protocol',
    shortName: 'AG-UI',
    version: '1.0.0',
    category: 'ui-interaction',
    description: 'CopilotKit bidirectional JSON event stream between agent backend and frontend. Real-time state synchronization with tool call visibility.',
    maintainer: 'CopilotKit',
    website: 'https://docs.ag-ui.com',
    color: '#EF4444',
    icon: 'Radio',
  },
  configSchema: {
    protocolId: 'ag-ui',
    groups: [
      {
        id: 'streaming',
        label: 'Stream Configuration',
        fields: [
          { key: 'transport', label: 'Transport', type: 'select', description: 'Event stream transport', defaultValue: 'sse', required: true, options: [{ label: 'Server-Sent Events', value: 'sse' }, { label: 'WebSocket', value: 'websocket' }, { label: 'HTTP Stream', value: 'http-stream' }] },
          { key: 'agentUrl', label: 'Agent URL', type: 'url', description: 'Agent backend endpoint', defaultValue: '', required: false, placeholder: 'https://agent-api.example.com/stream' },
          { key: 'heartbeatInterval', label: 'Heartbeat (ms)', type: 'slider', description: 'Connection keepalive interval', defaultValue: 30000, required: false, min: 5000, max: 120000, step: 5000 },
          { key: 'bufferSize', label: 'Buffer Size', type: 'number', description: 'Event buffer size', defaultValue: 100, required: false, min: 10, max: 10000 },
        ],
      },
      {
        id: 'state',
        label: 'State Management',
        fields: [
          { key: 'enableSnapshots', label: 'State Snapshots', type: 'boolean', description: 'Periodic full state snapshots', defaultValue: true, required: false },
          { key: 'enableDeltas', label: 'State Deltas', type: 'boolean', description: 'Incremental state updates', defaultValue: true, required: false },
          { key: 'snapshotInterval', label: 'Snapshot Interval (s)', type: 'slider', description: 'Seconds between state snapshots', defaultValue: 60, required: false, min: 10, max: 300, step: 10 },
        ],
      },
      {
        id: 'events',
        label: 'Event Configuration',
        fields: [
          { key: 'supportedEvents', label: 'Event Types', type: 'multi-select', description: 'Supported AG-UI event types', defaultValue: ['text-message-start', 'text-message-content', 'text-message-end', 'run-started', 'run-finished'], required: true, options: [{ label: 'Text Messages', value: 'text-message-start' }, { label: 'Text Content', value: 'text-message-content' }, { label: 'Text End', value: 'text-message-end' }, { label: 'Tool Calls', value: 'tool-call-start' }, { label: 'State Snapshots', value: 'state-snapshot' }, { label: 'State Deltas', value: 'state-delta' }, { label: 'Run Started', value: 'run-started' }, { label: 'Run Finished', value: 'run-finished' }] },
        ],
      },
    ],
  },
  compatibility: {
    protocolId: 'ag-ui',
    compatibleWith: ['mcp', 'a2a', 'adk', 'a2ui'],
    requiredBy: [],
    enhancedBy: ['a2ui'],
  },
  defaultConfig: { transport: 'sse', heartbeatInterval: 30000, bufferSize: 100, enableSnapshots: true, enableDeltas: true, snapshotInterval: 60, supportedEvents: ['text-message-start', 'text-message-content', 'text-message-end', 'run-started', 'run-finished'] },
  exampleConfig: { transport: 'websocket', agentUrl: 'wss://agent.example.com/stream', heartbeatInterval: 15000, bufferSize: 500, enableSnapshots: true, enableDeltas: true, snapshotInterval: 30, supportedEvents: ['text-message-start', 'text-message-content', 'text-message-end', 'tool-call-start', 'state-snapshot', 'state-delta', 'run-started', 'run-finished'] },
  protocolFeatures: ['Bidirectional Events', 'State Synchronization', 'Tool Call Visibility', 'Progressive Streaming', 'Reconnection', 'Custom Events'],
  useCases: ['Real-time chat interfaces', 'Agent monitoring dashboards', 'Collaborative editing', 'Live debugging tools'],
};
