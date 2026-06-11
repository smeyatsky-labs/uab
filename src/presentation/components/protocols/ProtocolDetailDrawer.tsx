import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useProtocolRegistry } from '../../hooks/useProtocolRegistry.ts';
import { ProtocolIcon } from '../ui/ProtocolIcon.tsx';
import { ProtocolBadge } from '../ui/ProtocolBadge.tsx';
import type { ProtocolId } from '../../../domain/protocols/protocol.types.ts';

interface ProtocolDetailDrawerProps {
  protocolId: ProtocolId | null;
  onClose: () => void;
}

export function ProtocolDetailDrawer({ protocolId, onClose }: ProtocolDetailDrawerProps) {
  const { getById } = useProtocolRegistry();
  const spec = protocolId ? getById(protocolId) : null;

  return (
    <AnimatePresence>
      {spec && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-background/95 backdrop-blur-xl"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${spec.metadata.color}20`, color: spec.metadata.color }}
                  >
                    <ProtocolIcon protocolId={spec.metadata.id} size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-100">{spec.metadata.name}</h2>
                    <p className="text-xs font-mono text-gray-500">v{spec.metadata.version} · {spec.metadata.maintainer}</p>
                  </div>
                </div>
                <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-white/10">
                  <X size={18} />
                </button>
              </div>

              <p className="mb-6 text-sm text-gray-300 leading-relaxed">{spec.metadata.description}</p>

              <section className="mb-6">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Protocol features</h3>
                <div className="flex flex-wrap gap-1.5">
                  {spec.protocolFeatures.map(cap => (
                    <span key={cap} className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-gray-300">
                      {cap}
                    </span>
                  ))}
                </div>
              </section>

              <section className="mb-6">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Use Cases</h3>
                <ul className="space-y-1.5">
                  {spec.useCases.map(uc => (
                    <li key={uc} className="text-xs text-gray-400 flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-primary shrink-0" />
                      {uc}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mb-6">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Compatible With</h3>
                <div className="flex flex-wrap gap-1.5">
                  {spec.compatibility.compatibleWith.map(id => (
                    <ProtocolBadge key={id} protocolId={id} size="sm" />
                  ))}
                </div>
              </section>

              {spec.compatibility.enhancedBy.length > 0 && (
                <section className="mb-6">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Enhanced By</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {spec.compatibility.enhancedBy.map(id => (
                      <ProtocolBadge key={id} protocolId={id} size="sm" />
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Example Configuration</h3>
                <pre className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs font-mono text-gray-400 overflow-auto max-h-64">
                  {JSON.stringify(spec.exampleConfig, null, 2)}
                </pre>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
