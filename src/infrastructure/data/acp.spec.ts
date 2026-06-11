import type { ProtocolSpec } from '../../domain/protocols/protocol.types.ts';

export const acpSpec: ProtocolSpec = {
  metadata: {
    id: 'acp',
    name: 'Agentic Commerce Protocol',
    shortName: 'ACP',
    version: '1.0.0',
    category: 'commerce',
    description: 'OpenAI + Stripe open standard for AI agent purchases. Powers ChatGPT Instant Checkout with secure, agent-initiated transactions.',
    maintainer: 'OpenAI + Stripe',
    website: 'https://openai.com/agentic-commerce',
    color: '#8B5CF6',
    icon: 'ShoppingCart',
  },
  configSchema: {
    protocolId: 'acp',
    groups: [
      {
        id: 'merchant',
        label: 'Merchant Profile',
        fields: [
          { key: 'merchantName', label: 'Merchant Name', type: 'text', description: 'Business name for transactions', defaultValue: '', required: true, placeholder: 'My Store' },
          { key: 'catalogEndpoint', label: 'Catalog API', type: 'url', description: 'Product catalog endpoint', defaultValue: '', required: false, placeholder: 'https://api.store.com/catalog' },
          { key: 'currencies', label: 'Supported Currencies', type: 'multi-select', description: 'Accepted payment currencies', defaultValue: ['USD'], required: true, options: [{ label: 'USD', value: 'USD' }, { label: 'EUR', value: 'EUR' }, { label: 'GBP', value: 'GBP' }, { label: 'JPY', value: 'JPY' }] },
        ],
      },
      {
        id: 'checkout',
        label: 'Checkout Settings',
        fields: [
          { key: 'instantCheckout', label: 'Instant Checkout', type: 'boolean', description: 'Enable one-click agent purchases', defaultValue: true, required: false },
          { key: 'requireConfirmation', label: 'Require Human Confirmation', type: 'boolean', description: 'Require human approval before purchase', defaultValue: true, required: false },
          { key: 'maxTransactionAmount', label: 'Max Transaction ($)', type: 'slider', description: 'Maximum single transaction amount', defaultValue: 500, required: true, min: 1, max: 10000, step: 10 },
          { key: 'sandboxMode', label: 'Sandbox Mode', type: 'boolean', description: 'Use test environment', defaultValue: true, required: false },
        ],
      },
    ],
  },
  compatibility: {
    protocolId: 'acp',
    compatibleWith: ['ucp', 'ap2', 'visa-tap'],
    requiredBy: ['ap2'],
    enhancedBy: ['visa-tap', 'ucp'],
  },
  defaultConfig: { merchantName: '', currencies: ['USD'], instantCheckout: true, requireConfirmation: true, maxTransactionAmount: 500, sandboxMode: true },
  exampleConfig: { merchantName: 'TechMart AI', catalogEndpoint: 'https://api.techmart.com/v2/catalog', currencies: ['USD', 'EUR'], instantCheckout: true, requireConfirmation: false, maxTransactionAmount: 5000, sandboxMode: false },
  protocolFeatures: ['Instant Checkout', 'Product Discovery', 'Cart Management', 'Order Tracking', 'Refund Processing', 'Multi-Currency'],
  useCases: ['AI shopping assistants', 'Automated procurement', 'Subscription management', 'Price comparison agents'],
};
