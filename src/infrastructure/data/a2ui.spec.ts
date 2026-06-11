import type { ProtocolSpec } from '../../domain/protocols/protocol.types.ts';

export const a2uiSpec: ProtocolSpec = {
  metadata: {
    id: 'a2ui',
    name: 'Agent-to-UI Protocol',
    shortName: 'A2UI',
    version: '0.8.0',
    category: 'ui-interaction',
    description: 'Google declarative UI protocol for agent-driven interfaces. LLM-friendly component model with streaming support and progressive rendering.',
    maintainer: 'Google',
    website: 'https://developers.google.com/a2ui',
    color: '#06B6D4',
    icon: 'Layout',
  },
  configSchema: {
    protocolId: 'a2ui',
    groups: [
      {
        id: 'components',
        label: 'Component Support',
        fields: [
          { key: 'supportedComponents', label: 'Components', type: 'multi-select', description: 'UI component types to support', defaultValue: ['text', 'card', 'list'], required: true, options: [{ label: 'Text', value: 'text' }, { label: 'Card', value: 'card' }, { label: 'List', value: 'list' }, { label: 'Form', value: 'form' }, { label: 'Chart', value: 'chart' }, { label: 'Table', value: 'table' }, { label: 'Media', value: 'media' }, { label: 'Action', value: 'action' }] },
          { key: 'maxRenderDepth', label: 'Max Render Depth', type: 'slider', description: 'Maximum nesting depth for components', defaultValue: 5, required: false, min: 1, max: 20, step: 1 },
        ],
      },
      {
        id: 'streaming',
        label: 'Streaming',
        fields: [
          { key: 'enableStreaming', label: 'Enable Streaming', type: 'boolean', description: 'Stream UI updates progressively', defaultValue: true, required: false },
          { key: 'progressiveRendering', label: 'Progressive Rendering', type: 'boolean', description: 'Render partial results as they arrive', defaultValue: true, required: false },
          { key: 'optimisticUpdates', label: 'Optimistic Updates', type: 'boolean', description: 'Apply UI changes optimistically', defaultValue: false, required: false },
        ],
      },
      {
        id: 'theme',
        label: 'Theme & Accessibility',
        fields: [
          { key: 'themeMode', label: 'Theme Mode', type: 'select', description: 'UI theme preference', defaultValue: 'dark', required: false, options: [{ label: 'Light', value: 'light' }, { label: 'Dark', value: 'dark' }, { label: 'System', value: 'system' }] },
          { key: 'accessibilityLevel', label: 'Accessibility', type: 'select', description: 'WCAG compliance level', defaultValue: 'aa', required: false, options: [{ label: 'Level A', value: 'a' }, { label: 'Level AA', value: 'aa' }, { label: 'Level AAA', value: 'aaa' }] },
        ],
      },
    ],
  },
  compatibility: {
    protocolId: 'a2ui',
    compatibleWith: ['mcp', 'adk', 'ag-ui', 'ucp'],
    requiredBy: [],
    enhancedBy: ['ag-ui'],
  },
  defaultConfig: { supportedComponents: ['text', 'card', 'list'], maxRenderDepth: 5, enableStreaming: true, progressiveRendering: true, optimisticUpdates: false, themeMode: 'dark', accessibilityLevel: 'aa' },
  exampleConfig: { supportedComponents: ['text', 'card', 'list', 'form', 'chart', 'table', 'media', 'action'], maxRenderDepth: 10, enableStreaming: true, progressiveRendering: true, optimisticUpdates: true, themeMode: 'dark', accessibilityLevel: 'aaa' },
  protocolFeatures: ['Declarative UI', 'Streaming Rendering', 'Component Composition', 'Progressive Updates', 'Theme Support', 'Accessibility'],
  useCases: ['Agent dashboard UIs', 'Dynamic form generation', 'Data visualization', 'Interactive reports'],
};
