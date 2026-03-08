import React from 'react';
import { Brain, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';

interface TokenFlowPanelProps {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  topModel: string;
  requestsPerMin: number;
  limit: number;
}

export function TokenFlowPanel({ promptTokens, completionTokens, totalTokens, topModel, requestsPerMin, limit }: TokenFlowPanelProps) {
  const usagePercent = Math.min((totalTokens / limit) * 100, 100);
  const ratio = promptTokens > 0 ? (completionTokens / promptTokens) : 0;
  const fmt = (n: number) => n > 1e9 ? `${(n/1e9).toFixed(2)}B` : n > 1e6 ? `${(n/1e6).toFixed(1)}M` : n > 1e3 ? `${(n/1e3).toFixed(0)}K` : String(n);

  return (
    <div className="bg-[#0E0F11] border border-[#1E2030] rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#8E9299]">Token Usage</h3>
        </div>
        <span className="text-[10px] font-mono text-[#8E9299]">cumulativo</span>
      </div>

      {/* Flow visualization */}
      <div className="flex items-center gap-2 mb-4 bg-[#151619] rounded-lg p-3 border border-[#1E2030]">
        <div className="text-center flex-1">
          <div className="text-[9px] font-mono text-blue-400 uppercase tracking-wider mb-1">Prompt</div>
          <div className="text-lg font-black font-mono text-blue-400">{fmt(promptTokens)}</div>
        </div>
        <ArrowRight className="w-4 h-4 text-[#2A2B30] shrink-0" />
        <div className="text-center flex-1">
          <div className="text-[9px] font-mono text-purple-400 uppercase tracking-wider mb-1">Completion</div>
          <div className="text-lg font-black font-mono text-purple-400">{fmt(completionTokens)}</div>
        </div>
        <ArrowRight className="w-4 h-4 text-[#2A2B30] shrink-0" />
        <div className="text-center flex-1">
          <div className="text-[9px] font-mono text-white uppercase tracking-wider mb-1">Total</div>
          <div className="text-lg font-black font-mono text-white">{fmt(totalTokens)}</div>
        </div>
      </div>

      {/* Ratio bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[9px] font-mono text-[#8E9299] mb-1.5">
          <span>Prompt / Completion ratio</span>
          <span className={clsx(ratio > 0.5 ? 'text-green-400' : 'text-yellow-400')}>{ratio.toFixed(2)}</span>
        </div>
        <div className="h-1.5 bg-[#1A1B1F] rounded-full overflow-hidden">
          <div className="h-full flex">
            <div className="bg-blue-500 transition-all" style={{ width: `${100 - (ratio / (1 + ratio)) * 100}%` }} />
            <div className="bg-purple-500 transition-all" style={{ width: `${(ratio / (1 + ratio)) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Usage vs limit */}
      <div className="mb-3">
        <div className="flex justify-between text-[9px] font-mono text-[#8E9299] mb-1.5">
          <span>Uso vs Limite</span>
          <span>{usagePercent.toFixed(1)}% de {fmt(limit)}</span>
        </div>
        <div className="h-1.5 bg-[#1A1B1F] rounded-full overflow-hidden">
          <div className={clsx('h-full transition-all duration-700 rounded-full', {
            'bg-purple-500': usagePercent < 70,
            'bg-yellow-500': usagePercent >= 70 && usagePercent < 90,
            'bg-red-500': usagePercent >= 90,
          })} style={{ width: `${usagePercent}%` }} />
        </div>
      </div>

      {/* Top model */}
      <div className="flex items-center justify-between bg-[#151619] border border-[#1E2030] rounded-lg px-3 py-2">
        <span className="text-[9px] font-mono text-[#8E9299] uppercase tracking-wider">Top Modelo</span>
        <span className="text-xs font-mono text-amber-400 font-bold truncate max-w-[150px]">{topModel}</span>
      </div>
    </div>
  );
}
