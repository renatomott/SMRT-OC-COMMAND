import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LLMData } from '../types';
import { CheckCircle, AlertTriangle, XCircle, Layers } from 'lucide-react';

interface ProviderHealthProps {
  models: LLMData[];
  className?: string;
}

const PROVIDER_COLORS: Record<string, { dot: string; bg: string; border: string }> = {
  ollama:      { dot: 'bg-blue-500',   bg: 'bg-blue-500/5',   border: 'border-blue-500/20' },
  moonshot:    { dot: 'bg-purple-500', bg: 'bg-purple-500/5', border: 'border-purple-500/20' },
  openrouter:  { dot: 'bg-amber-500',  bg: 'bg-amber-500/5',  border: 'border-amber-500/20' },
  openai:      { dot: 'bg-green-500',  bg: 'bg-green-500/5',  border: 'border-green-500/20' },
  anthropic:   { dot: 'bg-orange-500', bg: 'bg-orange-500/5', border: 'border-orange-500/20' },
};

export function ProviderHealth({ models, className }: ProviderHealthProps) {
  if (!models || models.length === 0) return null;

  const providers = models.reduce((acc, model) => {
    const provider = model.provider || 'Unknown';
    if (!acc[provider]) acc[provider] = [];
    acc[provider].push(model);
    return acc;
  }, {} as Record<string, LLMData[]>);

  return (
    <div className={twMerge('bg-[#0E0F11] border border-[#1E2030] rounded-xl p-4 shadow-sm', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-4 h-4 text-[#8E9299]" />
        <h3 className="text-[#8E9299] text-[10px] font-mono uppercase tracking-widest">Providers</h3>
        <span className="ml-auto text-[10px] font-mono text-[#8E9299]">{Object.keys(providers).length} ativos</span>
      </div>

      <div className="space-y-2">
        {Object.entries(providers).map(([provider, provModels]) => {
          const isHealthy = provModels.every(m => m.state === 'online' || m.state === 'active' || !m.state);
          const isDown = provModels.some(m => m.state === 'offline');
          const colors = PROVIDER_COLORS[provider.toLowerCase()] || { dot: 'bg-gray-500', bg: 'bg-gray-500/5', border: 'border-gray-500/20' };

          return (
            <div key={provider} className={clsx('flex items-center justify-between px-3 py-2.5 rounded-lg border', colors.bg, colors.border)}>
              <div className="flex items-center gap-2.5">
                <div className={clsx('w-1.5 h-1.5 rounded-full', isDown ? 'bg-red-500' : isHealthy ? colors.dot : 'bg-yellow-500')} />
                <span className="text-xs font-mono font-bold text-white capitalize">{provider}</span>
                <span className="text-[10px] font-mono text-[#8E9299]">{provModels.length} modelo{provModels.length !== 1 ? 's' : ''}</span>
              </div>
              <span className={clsx('text-[10px] font-mono uppercase font-bold', {
                'text-green-400': isHealthy && !isDown,
                'text-yellow-400': !isHealthy && !isDown,
                'text-red-400': isDown,
              })}>
                {isDown ? 'offline' : isHealthy ? 'ok' : 'degraded'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
