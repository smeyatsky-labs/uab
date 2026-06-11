import type { ProtocolSpec } from '../../domain/protocols/protocol.types.ts';

export const mcpSpec: ProtocolSpec = {
  metadata: {
    id: 'mcp',
    name: 'Model Context Protocol',
    shortName: 'MCP',
    version: '1.0.0',
    category: 'core-agent',
    description: 'Anthropic standard for AI↔infrastructure communication via Tools, Resources, and Prompts. The foundational protocol for connecting AI models to external capabilities.',
    maintainer: 'Anthropic',
    website: 'https://modelcontextprotocol.io',
    color: '#D97706',
    icon: 'Cpu',
  },
  configSchema: {
    protocolId: 'mcp',
    groups: [
      {
        id: 'servers',
        label: 'Server Configuration',
        description: 'Configure MCP server connections',
        fields: [
          { key: 'transport', label: 'Transport', type: 'select', description: 'Communication transport type', defaultValue: 'stdio', required: true, options: [{ label: 'Standard I/O', value: 'stdio' }, { label: 'Streamable HTTP', value: 'streamable-http' }, { label: 'SSE', value: 'sse' }] },
          { key: 'serverUrl', label: 'Server URL', type: 'url', description: 'MCP server endpoint URL', defaultValue: '', required: false, placeholder: 'https://mcp-server.example.com' },
          { key: 'serverCommand', label: 'Server Command', type: 'text', description: 'Command to start MCP server (stdio transport)', defaultValue: '', required: false, placeholder: 'npx @modelcontextprotocol/server' },
        ],
      },
      {
        id: 'capabilities',
        label: 'Capabilities',
        description: 'Enable MCP capability types',
        fields: [
          { key: 'enableTools', label: 'Enable Tools', type: 'boolean', description: 'Allow tool invocations (write operations)', defaultValue: true, required: false },
          { key: 'enableResources', label: 'Enable Resources', type: 'boolean', description: 'Allow resource access (read operations)', defaultValue: true, required: false },
          { key: 'enablePrompts', label: 'Enable Prompts', type: 'boolean', description: 'Allow prompt templates', defaultValue: true, required: false },
          { key: 'enableSampling', label: 'Enable Sampling', type: 'boolean', description: 'Allow LLM sampling requests from server', defaultValue: false, required: false },
        ],
      },
      {
        id: 'limits',
        label: 'Limits & Performance',
        fields: [
          { key: 'contextWindow', label: 'Context Window', type: 'slider', description: 'Maximum context window size in tokens', defaultValue: 128000, required: true, min: 4096, max: 200000, step: 4096 },
          { key: 'maxToolCalls', label: 'Max Tool Calls', type: 'number', description: 'Maximum concurrent tool calls', defaultValue: 10, required: false, min: 1, max: 100 },
          { key: 'timeoutMs', label: 'Request Timeout (ms)', type: 'number', description: 'Maximum time for a single request', defaultValue: 30000, required: false, min: 1000, max: 300000 },
        ],
      },
    ],
  },
  compatibility: {
    protocolId: 'mcp',
    compatibleWith: ['a2a', 'adk', 'a2ui', 'ag-ui'],
    requiredBy: [],
    enhancedBy: ['a2a', 'adk'],
  },
  defaultConfig: { transport: 'stdio', enableTools: true, enableResources: true, enablePrompts: true, enableSampling: false, contextWindow: 128000, maxToolCalls: 10, timeoutMs: 30000 },
  exampleConfig: { transport: 'streamable-http', serverUrl: 'https://mcp.example.com/v1', enableTools: true, enableResources: true, enablePrompts: true, enableSampling: true, contextWindow: 200000, maxToolCalls: 25, timeoutMs: 60000 },
  protocolFeatures: ['Tool Invocation', 'Resource Access', 'Prompt Templates', 'LLM Sampling', 'Server Discovery', 'Capability Negotiation'],
  useCases: ['Connect AI to databases', 'File system access', 'API integration', 'Code execution', 'Knowledge base queries'],
};
