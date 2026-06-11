import type { ProtocolSpec } from '../../domain/protocols/protocol.types.ts';

export const ap2Spec: ProtocolSpec = {
  metadata: {
    id: 'ap2',
    name: 'Agent Payments Protocol',
    shortName: 'AP2',
    version: '0.5.0',
    category: 'payments',
    description: 'Secure agent-initiated payments with configurable limits, authorization policies, and fraud detection. Works alongside UCP for end-to-end commerce.',
    maintainer: 'AP2 Consortium',
    website: 'https://agentpayments.org',
    color: '#F59E0B',
    icon: 'CreditCard',
  },
  configSchema: {
    protocolId: 'ap2',
    groups: [
      {
        id: 'payment-methods',
        label: 'Payment Methods',
        fields: [
          { key: 'paymentMethods', label: 'Allowed Methods', type: 'multi-select', description: 'Accepted payment methods', defaultValue: ['card'], required: true, options: [{ label: 'Card', value: 'card' }, { label: 'Bank Transfer', value: 'bank-transfer' }, { label: 'Crypto', value: 'crypto' }, { label: 'Digital Wallet', value: 'digital-wallet' }] },
          { key: 'settlementCurrency', label: 'Settlement Currency', type: 'select', description: 'Currency for settlement', defaultValue: 'USD', required: true, options: [{ label: 'USD', value: 'USD' }, { label: 'EUR', value: 'EUR' }, { label: 'GBP', value: 'GBP' }] },
        ],
      },
      {
        id: 'limits',
        label: 'Transaction Limits',
        fields: [
          { key: 'maxPerTransaction', label: 'Max Per Transaction', type: 'slider', description: 'Maximum amount per transaction', defaultValue: 1000, required: true, min: 1, max: 50000, step: 100 },
          { key: 'maxDaily', label: 'Daily Limit', type: 'number', description: 'Maximum daily spend', defaultValue: 5000, required: false, min: 100, max: 500000 },
          { key: 'maxMonthly', label: 'Monthly Limit', type: 'number', description: 'Maximum monthly spend', defaultValue: 50000, required: false, min: 1000, max: 5000000 },
        ],
      },
      {
        id: 'authorization',
        label: 'Authorization Policy',
        fields: [
          { key: 'requireHumanApproval', label: 'Human Approval', type: 'boolean', description: 'Require human approval for transactions', defaultValue: true, required: false },
          { key: 'approvalThreshold', label: 'Auto-Approve Below ($)', type: 'slider', description: 'Auto-approve transactions below this amount', defaultValue: 50, required: false, min: 0, max: 5000, step: 10 },
          { key: 'fraudDetection', label: 'Fraud Detection', type: 'boolean', description: 'Enable AI-powered fraud detection', defaultValue: true, required: false },
          { key: 'auditLogging', label: 'Audit Logging', type: 'boolean', description: 'Log all transactions for compliance', defaultValue: true, required: false },
        ],
      },
    ],
  },
  compatibility: {
    protocolId: 'ap2',
    compatibleWith: ['acp', 'ucp', 'visa-tap', 'toon'],
    requiredBy: [],
    enhancedBy: ['visa-tap'],
  },
  defaultConfig: { paymentMethods: ['card'], settlementCurrency: 'USD', maxPerTransaction: 1000, maxDaily: 5000, maxMonthly: 50000, requireHumanApproval: true, approvalThreshold: 50, fraudDetection: true, auditLogging: true },
  exampleConfig: { paymentMethods: ['card', 'digital-wallet'], settlementCurrency: 'USD', maxPerTransaction: 10000, maxDaily: 50000, maxMonthly: 500000, requireHumanApproval: false, approvalThreshold: 500, fraudDetection: true, auditLogging: true },
  protocolFeatures: ['Multi-Method Payments', 'Transaction Limits', 'Human-in-the-Loop', 'Fraud Detection', 'Audit Logging', 'Tokenization'],
  useCases: ['Autonomous purchasing agents', 'Subscription payments', 'B2B transactions', 'Micro-payments for agent services'],
};
