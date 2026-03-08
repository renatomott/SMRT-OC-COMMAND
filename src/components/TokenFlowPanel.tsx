import React from 'react';
import { Brain, Zap, Activity } from 'lucide-react';
import { clsx } from 'clsx';

interface TokenFlowPanelProps {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  topModel: string;
  requestsPerMin: number;
  limit: number;
}

export function TokenFlowPanel({
  promptTokens,
  completionTokens,
  totalTokens,
  topModel,
  requestsPerMin,
  limit
}: TokenFlowPanelProps) {
  const usagePercent = Math.min((totalTokens / limit) * 100, 100);

  return (
    <div className="bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-sm font-bold flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-500" />
          TOKEN FLOW (LAST 60s)
        </h3>
        <span className="text-[10px] font-mono text-[#8E9299] uppercase tracking-wider">REAL-TIME</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-[#09090B] p-3 rounded border border-[#2A2B30]">
          <div className="text-[10px] text-[#8E9299] font-mono uppercase mb-1">PROMPT</div>
          <div className="text-lg font-mono font-bold text-blue-400">{promptTokens.toLocaleString()}</div>
        </div>
        <div className="bg-[#09090B] p-3 rounded border border-[#2A2B30]">
          <div className="text-[10px] text-[#8E9299] font-mono uppercase mb-1">COMPLETION</div>
          <div className="text-lg font-mono font-bold text-green-400">{completionTokens.toLocaleString()}</div>
        </div>
        <div className="bg-[#09090B] p-3 rounded border border-[#2A2B30]">
          <div className="text-[10px] text-[#8E9299] font-mono uppercase mb-1">TOTAL</div>
          <div className="text-lg font-mono font-bold text-white">{totalTokens.toLocaleString()}</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs font-mono text-[#8E9299] mb-2">
        <span>USAGE vs LIMIT</span>
        <span>{Math.round(usagePercent)}%</span>
      </div>
      
      <div className="h-2 bg-[#2A2B30] rounded-full overflow-hidden mb-4 relative">
        <div 
          className={clsx("h-full transition-all duration-500 ease-out", {
            "bg-purple-500": usagePercent < 70,
            "bg-yellow-500": usagePercent >= 70 && usagePercent < 90,
            "bg-red-500 animate-pulse": usagePercent >= 90
          })}
          style={{ width: `${usagePercent}%` }}
        />
        {/* Animated stripes overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress-stripes_1s_linear_infinite]" />
      </div>

      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#2A2B30]">
        <div className="flex items-center gap-2">
          <Activity className="w-3 h-3 text-[#8E9299]" />
          <span className="text-xs text-[#8E9299] font-mono">TOP MODEL:</span>
          <span className="text-xs text-white font-mono font-bold">{topModel}</span>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <Zap className="w-3 h-3 text-[#8E9299]" />
          <span className="text-xs text-[#8E9299] font-mono">REQ/MIN:</span>
          <span className="text-xs text-white font-mono font-bold">{requestsPerMin}</span>
        </div>
      </div>
    </div>
  );
}
