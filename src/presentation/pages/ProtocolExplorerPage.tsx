import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProtocolRegistry } from '../hooks/useProtocolRegistry.ts';
import { GlassPanel } from '../components/ui/GlassPanel.tsx';
import { ProtocolIcon } from '../components/ui/ProtocolIcon.tsx';
import { ProtocolBadge } from '../components/ui/ProtocolBadge.tsx';
import { ProtocolMatrix } from '../components/protocols/ProtocolMatrix.tsx';
import { ProtocolDetailDrawer } from '../components/protocols/ProtocolDetailDrawer.tsx';
import type { ProtocolId, ProtocolCategory } from '../../domain/protocols/protocol.types.ts';

const categoryLabels: Record<ProtocolCategory, string> = {
  'core-agent': 'Core Agent Protocols',
  'commerce': 'Commerce Protocols',
  'payments': 'Payment Protocols',
  'trust-security': 'Trust & Security',
  'ui-interaction': 'UI / Interaction',
  'orchestration': 'Orchestration',
};

const categoryDescriptions: Record<ProtocolCategory, string> = {
  'core-agent': 'Foundational protocols for agent development, tool access, and multi-agent collaboration.',
  'commerce': 'Standards for AI-driven shopping, product discovery, and checkout across platforms.',
  'payments': 'Secure agent-initiated payment processing with authorization controls.',
  'trust-security': 'Identity verification and trust scoring for agent transactions.',
  'ui-interaction': 'Protocols for agent-driven UI rendering and real-time user interaction.',
  'orchestration': 'Smart contract negotiation and multi-party agreement management.',
};

export function ProtocolExplorerPage() {
  const { allProtocols, groupedByCategory } = useProtocolRegistry();
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolId | null>(null);
  const [showMatrix, setShowMatrix] = useState(false);

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Protocol Explorer
          </span>
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Interactive documentation for the 2026 agentic protocol stack — {allProtocols.length} protocols
        </p>
      </div>

      {/* Quick stats */}
      <div className="mb-8 flex flex-wrap gap-3">
        <GlassPanel padding="sm" className="inline-flex items-center gap-2">
          <span className="text-xs text-gray-400">Total Protocols</span>
          <span className="text-sm font-bold font-mono text-primary">{allProtocols.length}</span>
        </GlassPanel>
        <GlassPanel padding="sm" className="inline-flex items-center gap-2">
          <span className="text-xs text-gray-400">Categories</span>
          <span className="text-sm font-bold font-mono text-secondary">{groupedByCategory.size}</span>
        </GlassPanel>
        <button
          onClick={() => setShowMatrix(!showMatrix)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-gray-400 hover:border-primary/30 hover:text-primary transition-all"
        >
          {showMatrix ? 'Hide' : 'Show'} Compatibility Matrix
        </button>
      </div>

      {/* Compatibility Matrix */}
      <AnimatePresence>
        {showMatrix && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 overflow-hidden"
          >
            <ProtocolMatrix />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Protocol categories */}
      <div className="space-y-10">
        {[...groupedByCategory.entries()].map(([category, protocols]) => (
          <section key={category}>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-100">{categoryLabels[category]}</h2>
              <p className="text-sm text-gray-400">{categoryDescriptions[category]}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {protocols.map((spec) => (
                <motion.div
                  key={spec.metadata.id}
                  whileHover={{ y: -2 }}
                  onClick={() => setSelectedProtocol(spec.metadata.id)}
                >
                  <GlassPanel hover className="cursor-pointer h-full">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${spec.metadata.color}20`, color: spec.metadata.color }}
                      >
                        <ProtocolIcon protocolId={spec.metadata.id} size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-100">{spec.metadata.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-500">v{spec.metadata.version}</span>
                          <span className="text-xs text-gray-600">·</span>
                          <span className="text-xs text-gray-500">{spec.metadata.maintainer}</span>
                        </div>
                      </div>
                    </div>

                    <p className="mb-3 text-xs text-gray-400 leading-relaxed line-clamp-3">
                      {spec.metadata.description}
                    </p>

                    <div className="mb-3 flex flex-wrap gap-1">
                      {spec.protocolFeatures.slice(0, 4).map((cap) => (
                        <span
                          key={cap}
                          className="rounded-full border border-white/5 bg-white/[0.02] px-2 py-0.5 text-[10px] text-gray-500"
                        >
                          {cap}
                        </span>
                      ))}
                      {spec.protocolFeatures.length > 4 && (
                        <span className="text-[10px] text-gray-600">+{spec.protocolFeatures.length - 4}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 border-t border-white/5 pt-3">
                      <span className="text-[10px] text-gray-600">Compatible with:</span>
                      {spec.compatibility.compatibleWith.slice(0, 4).map((id) => (
                        <ProtocolBadge key={id} protocolId={id} size="xs" />
                      ))}
                    </div>
                  </GlassPanel>
                </motion.div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <ProtocolDetailDrawer
        protocolId={selectedProtocol}
        onClose={() => setSelectedProtocol(null)}
      />
    </div>
  );
}
