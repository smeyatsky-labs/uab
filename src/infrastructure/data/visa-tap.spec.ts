import type { ProtocolSpec } from '../../domain/protocols/protocol.types.ts';

export const visaTapSpec: ProtocolSpec = {
  metadata: {
    id: 'visa-tap',
    name: 'Visa Trusted Agent Protocol',
    shortName: 'Visa TAP',
    version: '1.0.0',
    category: 'trust-security',
    description: 'Visa + Cloudflare protocol to distinguish legitimate AI agents from bots at checkout. Provides cryptographic identity verification with 100+ partner merchants.',
    maintainer: 'Visa + Cloudflare',
    website: 'https://developer.visa.com/tap',
    color: '#1A1F71',
    icon: 'ShieldCheck',
  },
  configSchema: {
    protocolId: 'visa-tap',
    groups: [
      {
        id: 'identity',
        label: 'Agent Identity',
        fields: [
          { key: 'organizationId', label: 'Organization ID', type: 'text', description: 'Visa-registered organization identifier', defaultValue: '', required: true, placeholder: 'org_xxxxxxxx' },
          { key: 'verificationLevel', label: 'Verification Level', type: 'select', description: 'Agent verification tier', defaultValue: 'standard', required: true, options: [{ label: 'Basic', value: 'basic' }, { label: 'Standard', value: 'standard' }, { label: 'Enhanced', value: 'enhanced' }, { label: 'Premium', value: 'premium' }] },
        ],
      },
      {
        id: 'trust',
        label: 'Trust Configuration',
        fields: [
          { key: 'cloudflareIntegration', label: 'Cloudflare Integration', type: 'boolean', description: 'Enable Cloudflare Turnstile integration', defaultValue: true, required: false },
          { key: 'challengeResponse', label: 'Challenge-Response', type: 'boolean', description: 'Enable cryptographic challenge-response', defaultValue: true, required: false },
          { key: 'tokenRefreshInterval', label: 'Token Refresh (min)', type: 'slider', description: 'Agent token refresh interval', defaultValue: 60, required: false, min: 5, max: 1440, step: 5 },
        ],
      },
      {
        id: 'compliance',
        label: 'Compliance',
        fields: [
          { key: 'regions', label: 'Operating Regions', type: 'multi-select', description: 'Regions where agent operates', defaultValue: ['US'], required: true, options: [{ label: 'US', value: 'US' }, { label: 'EU', value: 'EU' }, { label: 'UK', value: 'UK' }, { label: 'APAC', value: 'APAC' }] },
          { key: 'gdprCompliant', label: 'GDPR Compliant', type: 'boolean', description: 'Enable GDPR compliance mode', defaultValue: false, required: false },
          { key: 'dataRetentionDays', label: 'Data Retention (days)', type: 'slider', description: 'Transaction data retention period', defaultValue: 90, required: false, min: 30, max: 365, step: 30 },
        ],
      },
    ],
  },
  compatibility: {
    protocolId: 'visa-tap',
    compatibleWith: ['acp', 'ucp', 'ap2', 'a2a'],
    requiredBy: [],
    enhancedBy: [],
  },
  defaultConfig: { organizationId: '', verificationLevel: 'standard', cloudflareIntegration: true, challengeResponse: true, tokenRefreshInterval: 60, regions: ['US'], gdprCompliant: false, dataRetentionDays: 90 },
  exampleConfig: { organizationId: 'org_visa_premium_001', verificationLevel: 'premium', cloudflareIntegration: true, challengeResponse: true, tokenRefreshInterval: 15, regions: ['US', 'EU', 'UK'], gdprCompliant: true, dataRetentionDays: 365 },
  protocolFeatures: ['Agent Identity Verification', 'Cryptographic Challenges', 'Bot Detection', 'Cloudflare Integration', 'Multi-Region Compliance', 'Trust Scoring'],
  useCases: ['Secure checkout verification', 'Agent identity attestation', 'Fraud prevention', 'Merchant trust networks'],
};
