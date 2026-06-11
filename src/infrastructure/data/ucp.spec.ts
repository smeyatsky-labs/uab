import type { ProtocolSpec } from '../../domain/protocols/protocol.types.ts';

export const ucpSpec: ProtocolSpec = {
  metadata: {
    id: 'ucp',
    name: 'Universal Commerce Protocol',
    shortName: 'UCP',
    version: '0.9.0',
    category: 'commerce',
    description: 'Google + Shopify/Walmart/Target protocol for agentic shopping across surfaces. Unified product search, comparison, and purchasing across retailers.',
    maintainer: 'Google + Shopify',
    website: 'https://developers.google.com/commerce/ucp',
    color: '#EC4899',
    icon: 'Store',
  },
  configSchema: {
    protocolId: 'ucp',
    groups: [
      {
        id: 'retailers',
        label: 'Retailer Configuration',
        fields: [
          { key: 'preferredRetailers', label: 'Preferred Retailers', type: 'multi-select', description: 'Priority retailers for product search', defaultValue: [], required: false, options: [{ label: 'Shopify', value: 'shopify' }, { label: 'Walmart', value: 'walmart' }, { label: 'Target', value: 'target' }, { label: 'Custom', value: 'custom' }] },
          { key: 'enableComparison', label: 'Price Comparison', type: 'boolean', description: 'Enable cross-retailer price comparison', defaultValue: true, required: false },
        ],
      },
      {
        id: 'search',
        label: 'Search Settings',
        fields: [
          { key: 'maxResults', label: 'Max Results', type: 'slider', description: 'Maximum products per search', defaultValue: 20, required: false, min: 5, max: 100, step: 5 },
          { key: 'semanticSearch', label: 'Semantic Search', type: 'boolean', description: 'Enable AI-powered semantic search', defaultValue: true, required: false },
          { key: 'currency', label: 'Currency', type: 'select', description: 'Display currency', defaultValue: 'USD', required: true, options: [{ label: 'USD', value: 'USD' }, { label: 'EUR', value: 'EUR' }, { label: 'GBP', value: 'GBP' }] },
        ],
      },
      {
        id: 'surfaces',
        label: 'Surface Configuration',
        fields: [
          { key: 'surfaces', label: 'Supported Surfaces', type: 'multi-select', description: 'Interaction surfaces', defaultValue: ['chat'], required: true, options: [{ label: 'Chat', value: 'chat' }, { label: 'Voice', value: 'voice' }, { label: 'Visual', value: 'visual' }, { label: 'AR', value: 'ar' }] },
          { key: 'locale', label: 'Locale', type: 'text', description: 'Shopping locale', defaultValue: 'en-US', required: true, placeholder: 'en-US' },
        ],
      },
    ],
  },
  compatibility: {
    protocolId: 'ucp',
    compatibleWith: ['acp', 'ap2', 'visa-tap', 'a2ui'],
    requiredBy: [],
    enhancedBy: ['acp', 'visa-tap'],
  },
  defaultConfig: { preferredRetailers: [], enableComparison: true, maxResults: 20, semanticSearch: true, currency: 'USD', surfaces: ['chat'], locale: 'en-US' },
  exampleConfig: { preferredRetailers: ['shopify', 'walmart'], enableComparison: true, maxResults: 50, semanticSearch: true, currency: 'USD', surfaces: ['chat', 'voice', 'visual'], locale: 'en-US' },
  protocolFeatures: ['Cross-Retailer Search', 'Price Comparison', 'Multi-Surface Shopping', 'Semantic Discovery', 'Order Fulfillment', 'AR Preview'],
  useCases: ['Personal shopping agents', 'B2B procurement', 'Multi-vendor comparison', 'Voice commerce'],
};
