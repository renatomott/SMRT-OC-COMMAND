import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { LLMData } from '../types';
import { CheckCircle, AlertTriangle, XCircle, Activity } from 'lucide-react';

interface ProviderHealthProps {
  models: LLMData[];
  className?: string;
}

export function ProviderHealth({ models, className }: ProviderHealthProps) {
  if (!models || models.length === 0) return null;

  // Group models by provider
  const providers = models.reduce((acc, model) => {
    const provider = model.provider || 'Unknown';
    if (!acc[provider]) acc[provider] = [];
    acc[provider].push(model);
    return acc;
  }, {} as Record<string, LLMData[]>);

  return (
    <div className={twMerge("bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm", className)}>
      <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider mb-4">Provider Health Monitor</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(providers).map(([provider, models]) => {
          const isHealthy = models.every(m => m.state === 'online' || m.state === 'active');
          const hasIssues = models.some(m => m.state === 'maintenance');
          const isDown = models.some(m => m.state === 'offline');

          return (
            <div key={provider} className={clsx("p-4 rounded-lg border flex flex-col items-center justify-center text-center transition-colors", {
              "bg-green-500/10 border-green-500/20": isHealthy && !hasIssues && !isDown,
              "bg-yellow-500/10 border-yellow-500/20": hasIssues && !isDown,
              "bg-red-500/10 border-red-500/20": isDown
            })}>
              {isDown ? (
                <XCircle className="w-8 h-8 text-red-500 mb-2" />
              ) : hasIssues ? (
                <AlertTriangle className="w-8 h-8 text-yellow-500 mb-2" />
              ) : (
                <CheckCircle className="w-8 h-8 text-green-500 mb-2" />
              )}
              <h4 className="text-white font-bold font-mono">{provider}</h4>
              <span className="text-xs text-[#8E9299] font-mono mt-1">
                {models.length} Models • {isDown ? 'OFFLINE' : hasIssues ? 'DEGRADED' : 'OPERATIONAL'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
