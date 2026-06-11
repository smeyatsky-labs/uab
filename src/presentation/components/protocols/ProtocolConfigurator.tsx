import { useCallback } from 'react';
import { useProtocolRegistry } from '../../hooks/useProtocolRegistry.ts';
import { ProtocolIcon } from '../ui/ProtocolIcon.tsx';
import { GlassPanel } from '../ui/GlassPanel.tsx';
import type { ProtocolId, ConfigField } from '../../../domain/protocols/protocol.types.ts';
import { clsx } from 'clsx';

interface ProtocolConfiguratorProps {
  protocolId: ProtocolId;
  /** This protocol's current config map (governance-agnostic). */
  config: Record<string, unknown>;
  /** Persist an updated config map. The caller decides where it lives. */
  onChange: (config: Record<string, unknown>) => void;
}

export function ProtocolConfigurator({ protocolId, config, onChange }: ProtocolConfiguratorProps) {
  const { getById, getConfigSchema } = useProtocolRegistry();
  const spec = getById(protocolId);
  const schema = getConfigSchema(protocolId);

  const updateField = useCallback(
    (key: string, value: unknown) => {
      onChange({ ...config, [key]: value });
    },
    [config, onChange],
  );

  if (!spec || !schema) return null;

  return (
    <GlassPanel padding="none" className="overflow-hidden">
      <div
        className="flex items-center gap-2 border-b border-white/10 px-4 py-3"
        style={{ backgroundColor: `${spec.metadata.color}08` }}
      >
        <ProtocolIcon protocolId={protocolId} size={16} color={spec.metadata.color} />
        <span className="text-sm font-semibold" style={{ color: spec.metadata.color }}>
          {spec.metadata.shortName} Configuration
        </span>
        <span className="ml-auto text-[10px] font-mono text-gray-500">v{spec.metadata.version}</span>
      </div>
      <div className="divide-y divide-white/5">
        {schema.groups.map((group) => (
          <div key={group.id} className="px-4 py-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {group.label}
            </h4>
            {group.description && (
              <p className="mb-3 text-xs text-gray-500">{group.description}</p>
            )}
            <div className="space-y-3">
              {group.fields.map((field) => (
                <FieldRenderer
                  key={field.key}
                  field={field}
                  value={config[field.key] ?? field.defaultValue}
                  onChange={(val) => updateField(field.key, val)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </GlassPanel>
  );
}

function FieldRenderer({ field, value, onChange }: { field: ConfigField; value: unknown; onChange: (v: unknown) => void }) {
  switch (field.type) {
    case 'text':
    case 'url':
    case 'port':
      return (
        <div>
          <label className="mb-1 block text-xs text-gray-400">{field.label}</label>
          <input
            type={field.type === 'port' ? 'number' : 'text'}
            value={String(value ?? '')}
            onChange={(e) => onChange(field.type === 'port' ? Number(e.target.value) : e.target.value)}
            placeholder={field.placeholder}
            className="w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-gray-100 focus:border-primary/50 focus:outline-none"
          />
          <p className="mt-0.5 text-[10px] text-gray-600">{field.description}</p>
        </div>
      );

    case 'number':
      return (
        <div>
          <label className="mb-1 block text-xs text-gray-400">{field.label}</label>
          <input
            type="number"
            value={Number(value ?? field.defaultValue)}
            onChange={(e) => onChange(Number(e.target.value))}
            min={field.min}
            max={field.max}
            className="w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-gray-100 focus:border-primary/50 focus:outline-none"
          />
          <p className="mt-0.5 text-[10px] text-gray-600">{field.description}</p>
        </div>
      );

    case 'boolean':
      return (
        <label className="flex items-center justify-between gap-3 cursor-pointer group">
          <div>
            <span className="text-xs text-gray-300">{field.label}</span>
            <p className="text-[10px] text-gray-600">{field.description}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(value)}
            onClick={() => onChange(!value)}
            className={clsx(
              'relative h-5 w-9 shrink-0 rounded-full border transition-colors',
              value ? 'border-primary/50 bg-primary/30' : 'border-white/20 bg-white/10',
            )}
          >
            <span
              className={clsx(
                'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
                value ? 'translate-x-4' : 'translate-x-0.5',
              )}
            />
          </button>
        </label>
      );

    case 'select':
      return (
        <div>
          <label className="mb-1 block text-xs text-gray-400">{field.label}</label>
          <select
            value={String(value ?? '')}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-gray-100 focus:border-primary/50 focus:outline-none"
          >
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-gray-900">
                {opt.label}
              </option>
            ))}
          </select>
          <p className="mt-0.5 text-[10px] text-gray-600">{field.description}</p>
        </div>
      );

    case 'multi-select': {
      const selected = Array.isArray(value) ? value as string[] : [];
      return (
        <div>
          <label className="mb-1 block text-xs text-gray-400">{field.label}</label>
          <div className="flex flex-wrap gap-1.5">
            {field.options?.map((opt) => {
              const isSelected = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(
                      isSelected
                        ? selected.filter((v) => v !== opt.value)
                        : [...selected, opt.value],
                    );
                  }}
                  className={clsx(
                    'rounded-full border px-2.5 py-1 text-xs transition-colors',
                    isSelected
                      ? 'border-primary/50 bg-primary/20 text-primary'
                      : 'border-white/10 bg-white/[0.03] text-gray-400 hover:border-white/20',
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-[10px] text-gray-600">{field.description}</p>
        </div>
      );
    }

    case 'slider':
      return (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs text-gray-400">{field.label}</label>
            <span className="text-xs font-mono text-primary">{String(value)}</span>
          </div>
          <input
            type="range"
            min={field.min}
            max={field.max}
            step={field.step}
            value={Number(value ?? field.defaultValue)}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <p className="mt-0.5 text-[10px] text-gray-600">{field.description}</p>
        </div>
      );

    case 'tags': {
      const tags = Array.isArray(value) ? value as string[] : [];
      return (
        <div>
          <label className="mb-1 block text-xs text-gray-400">{field.label}</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-xs text-gray-300">
                {tag}
                <button onClick={() => onChange(tags.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400">×</button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder={field.placeholder}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                onChange([...tags, e.currentTarget.value.trim()]);
                e.currentTarget.value = '';
              }
            }}
            className="w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-gray-100 focus:border-primary/50 focus:outline-none"
          />
          <p className="mt-0.5 text-[10px] text-gray-600">{field.description}</p>
        </div>
      );
    }

    default:
      return null;
  }
}
