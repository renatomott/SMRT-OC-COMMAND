import React from 'react';
import { clsx } from 'clsx';
import { LLMData } from '../types';

interface ModelEfficiencyTableProps {
  models: LLMData[];
  tokenUsage: {
    per_model?: Array<{
      model: string;
      input: number;
      output: number;
    }>;
  };
}

export function ModelEfficiencyTable({ models, tokenUsage }: ModelEfficiencyTableProps) {
  // Calculate efficiency score for each model
  const modelStats = models.map(model => {
    const usage = tokenUsage.per_model?.find(u => u.model === model.name) || { input: 0, output: 0 };
    const total = usage.input + usage.output;
    const ratio = total > 0 ? usage.output / usage.input : 0;
    
    let score: 'good' | 'low' | 'waste' = 'low';
    if (ratio > 0.6) score = 'good';
    else if (ratio < 0.3) score = 'waste';

    return {
      ...model,
      usage: total,
      ratio,
      score
    };
  }).sort((a, b) => b.usage - a.usage);

  return (
    <div className="bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm">
      <h3 className="text-white text-sm font-bold mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500" />
        TOKEN EFFICIENCY SCORE
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#2A2B30] text-[10px] font-mono text-[#8E9299] uppercase tracking-wider">
              <th className="py-2 px-3 font-medium">MODEL</th>
              <th className="py-2 px-3 font-medium text-right">TOKENS</th>
              <th className="py-2 px-3 font-medium text-right">OUTPUT RATIO</th>
              <th className="py-2 px-3 font-medium text-center">SCORE</th>
            </tr>
          </thead>
          <tbody>
            {modelStats.map((model) => (
              <tr key={model.id} className="border-b border-[#2A2B30]/50 hover:bg-[#1E1F23] transition-colors">
                <td className="py-3 px-3 text-xs font-mono text-white font-medium">{model.name}</td>
                <td className="py-3 px-3 text-xs font-mono text-[#8E9299] text-right">{model.usage.toLocaleString()}</td>
                <td className="py-3 px-3 text-xs font-mono text-[#8E9299] text-right">{model.ratio.toFixed(2)}</td>
                <td className="py-3 px-3 text-center">
                  <span className={clsx("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider", {
                    "bg-green-500/10 text-green-500 border border-green-500/20": model.score === 'good',
                    "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20": model.score === 'low',
                    "bg-red-500/10 text-red-500 border border-red-500/20": model.score === 'waste'
                  })}>
                    {model.score}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
