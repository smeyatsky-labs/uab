import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';
import { useProtocolRegistry } from '../../hooks/useProtocolRegistry.ts';
import { ProtocolIcon } from '../ui/ProtocolIcon.tsx';
import type { ProtocolId } from '../../../domain/protocols/protocol.types.ts';

interface ProtocolSelectorProps {
  /** Currently-selected protocol ids (governance-agnostic). */
  selected: ProtocolId[];
  /** Toggle a protocol. The caller decides where the selection lives. */
  onToggle: (id: ProtocolId) => void;
  recommendations?: { protocolId: ProtocolId; confidence: number; reason: string }[];
}

const categoryLabels: Record<string, string> = {
  'core-agent': 'Core Agent',
  'commerce': 'Commerce',
  'payments': 'Payments',
  'trust-security': 'Trust & Security',
  'ui-interaction': 'UI / Interaction',
  'orchestration': 'Orchestration',
};

export function ProtocolSelector({ selected, onToggle, recommendations = [] }: ProtocolSelectorProps) {
  const { allProtocols } = useProtocolRegistry();

  const recMap = new Map(recommendations.map(r => [r.protocolId, r]));

  const grouped = new Map<string, typeof allProtocols>();
  for (const p of allProtocols) {
    const cat = p.metadata.category;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(p);
  }

  return (
    <div className="space-y-6">
      {[...grouped.entries()].map(([category, protocols]) => (
        <div key={category}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            {categoryLabels[category] ?? category}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {protocols.map((spec) => {
              const isSelected = selected.includes(spec.metadata.id);
              const rec = recMap.get(spec.metadata.id);

              return (
                <motion.button
                  key={spec.metadata.id}
                  onClick={() => onToggle(spec.metadata.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={clsx(
                    'relative flex items-start gap-3 rounded-lg border p-3 text-left transition-all',
                    isSelected
                      ? 'border-primary/50 bg-primary/10'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20',
                  )}
                >
                  <div
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${spec.metadata.color}20`, color: spec.metadata.color }}
                  >
                    <ProtocolIcon protocolId={spec.metadata.id} size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-100">{spec.metadata.shortName}</span>
                      <span className="text-[10px] font-mono text-gray-500">v{spec.metadata.version}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400 line-clamp-2">{spec.metadata.description}</p>
                    {rec && (
                      <span className="mt-1.5 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        Recommended — {Math.round(rec.confidence * 100)}%
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-background">
                      <Check size={12} />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
