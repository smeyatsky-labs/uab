import type { ProtocolSpec } from '../../domain/protocols/protocol.types.ts';

export const adkSpec: ProtocolSpec = {
  metadata: {
    id: 'adk',
    name: 'Agent Development Kit',
    shortName: 'ADK',
    version: '1.2.0',
    category: 'core-agent',
    description: 'Google code-first multi-agent framework with Sequential, Parallel, and Loop workflow patterns. Full lifecycle management for complex agent systems.',
    maintainer: 'Google',
    website: 'https://google.github.io/adk-docs',
    color: '#10B981',
    icon: 'GitBranch',
  },
  configSchema: {
    protocolId: 'adk',
    groups: [
      {
        id: 'workflow',
        label: 'Workflow Configuration',
        fields: [
          { key: 'workflowType', label: 'Workflow Type', type: 'select', description: 'Primary workflow pattern', defaultValue: 'sequential', required: true, options: [{ label: 'Sequential', value: 'sequential' }, { label: 'Parallel', value: 'parallel' }, { label: 'Loop', value: 'loop' }, { label: 'DAG', value: 'dag' }, { label: 'Custom', value: 'custom' }] },
          { key: 'maxParallelism', label: 'Max Parallelism', type: 'slider', description: 'Maximum concurrent workflow steps', defaultValue: 4, required: false, min: 1, max: 32, step: 1 },
          { key: 'loggingLevel', label: 'Logging Level', type: 'select', description: 'Workflow execution log verbosity', defaultValue: 'info', required: false, options: [{ label: 'Debug', value: 'debug' }, { label: 'Info', value: 'info' }, { label: 'Warn', value: 'warn' }, { label: 'Error', value: 'error' }] },
        ],
      },
      {
        id: 'execution',
        label: 'Execution Environment',
        fields: [
          { key: 'environment', label: 'Environment', type: 'select', description: 'Execution runtime', defaultValue: 'local', required: true, options: [{ label: 'Local', value: 'local' }, { label: 'Cloud', value: 'cloud' }, { label: 'Hybrid', value: 'hybrid' }] },
          { key: 'callbackUrl', label: 'Callback URL', type: 'url', description: 'Webhook for workflow completion events', defaultValue: '', required: false, placeholder: 'https://api.example.com/webhooks/workflow' },
        ],
      },
      {
        id: 'resources',
        label: 'Resource Limits',
        fields: [
          { key: 'maxMemoryMB', label: 'Max Memory (MB)', type: 'slider', description: 'Memory limit per workflow step', defaultValue: 512, required: false, min: 64, max: 8192, step: 64 },
          { key: 'maxExecutionTimeMs', label: 'Max Execution Time (ms)', type: 'number', description: 'Per-step timeout', defaultValue: 60000, required: false, min: 1000, max: 600000 },
          { key: 'maxTokensPerStep', label: 'Max Tokens/Step', type: 'number', description: 'Token budget per workflow step', defaultValue: 4096, required: false, min: 256, max: 100000 },
        ],
      },
    ],
  },
  compatibility: {
    protocolId: 'adk',
    compatibleWith: ['mcp', 'a2a', 'ag-ui', 'a2ui'],
    requiredBy: [],
    enhancedBy: ['mcp'],
  },
  defaultConfig: { workflowType: 'sequential', maxParallelism: 4, loggingLevel: 'info', environment: 'local', maxMemoryMB: 512, maxExecutionTimeMs: 60000, maxTokensPerStep: 4096 },
  exampleConfig: { workflowType: 'dag', maxParallelism: 16, loggingLevel: 'debug', environment: 'cloud', callbackUrl: 'https://api.example.com/webhooks/workflow', maxMemoryMB: 4096, maxExecutionTimeMs: 300000, maxTokensPerStep: 32000 },
  protocolFeatures: ['Sequential Workflows', 'Parallel Execution', 'Loop Patterns', 'DAG Orchestration', 'Resource Management', 'Lifecycle Hooks'],
  useCases: ['Multi-step data pipelines', 'Parallel research tasks', 'Iterative refinement loops', 'Complex agent orchestration'],
};
