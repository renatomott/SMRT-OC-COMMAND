import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Brain, TrendingUp, DollarSign, Zap, BarChart2 } from 'lucide-react';

interface ModelInsightsTableProps {
  tokenUsage?: {
    total_tokens?: number;
    total_input?: number;
    total_output?: number;
    per_model?: Array<{
      model: string;
      provider: string;
      input: number;
      output: number;
      total: number;
      cost: number;
      calls: number;
    }>;
  };
  ollamaModels?: Array<{ name: string; size_gb: number; is_remote: boolean }>;
  className?: string;
}

type SortKey = 'total' | 'calls' | 'avg_tokens' | 'cost_per_call' | 'output_ratio';

export function ModelInsightsTable({ tokenUsage, ollamaModels, className }: ModelInsightsTableProps) {
  const [sort, setSort] = useState<SortKey>('total');

  if (!tokenUsage?.per_model?.length) return (
    <div className={clsx('bg-[#0E0F11] border border-[#1E2030] rounded-xl p-6 text-center', className)}>
      <Brain className="w-8 h-8 text-[#2A2B30] mx-auto mb-2" />
      <span className="text-[#8E9299] font-mono text-xs">Sem dados de modelos ainda</span>
    </div>
  );

  const totalTokens = tokenUsage.total_tokens || 1;
  const totalCalls  = tokenUsage.per_model.reduce((s, m) => s + (m.calls || 0), 0) || 1;

  const enriched = tokenUsage.per_model.map(m => {
    const avgTokens = m.calls > 0 ? m.total / m.calls : 0;
    const costPerCall = m.calls > 0 ? (m.cost || 0) / m.calls : 0;
    const outputRatio = m.input > 0 ? m.output / m.input : 0;
    const dominance = (m.total / totalTokens) * 100;
    const callShare = (m.calls / totalCalls) * 100;
    const isLocal = ollamaModels?.some(o => m.model.includes(o.name.split(':')[0]));
    return { ...m, avgTokens, costPerCall, outputRatio, dominance, callShare, isLocal };
  });

  const sorted = [...enriched].sort((a, b) => {
    const map: Record<SortKey, (x: typeof a) => number> = {
      total:         x => -x.total,
      calls:         x => -x.calls,
      avg_tokens:    x => -x.avgTokens,
      cost_per_call: x => -x.costPerCall,
      output_ratio:  x => -x.outputRatio,
    };
    return map[sort](a) - map[sort](b);
  });

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <th
      className={clsx('pb-2.5 font-medium cursor-pointer select-none transition-colors text-right',
        sort === k ? 'text-white' : 'hover:text-white text-[#8E9299]')}
      onClick={() => setSort(k)}
    >
      {label}{sort === k && ' ↓'}
    </th>
  );

  return (
    <div className={clsx('bg-[#0E0F11] border border-[#1E2030] rounded-xl p-4', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-4 h-4 text-purple-400" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E9299]">Análise por Modelo</span>
        <span className="ml-auto text-[9px] font-mono text-[#8E9299]">clique no cabeçalho para ordenar</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[10px] font-mono">
          <thead>
            <tr className="border-b border-[#1A1B1F] text-[#8E9299]">
              <th className="pb-2.5 font-medium">MODELO</th>
              <SortBtn k="total"         label="TOKENS" />
              <SortBtn k="calls"         label="CALLS" />
              <SortBtn k="avg_tokens"    label="AVG/CALL" />
              <SortBtn k="output_ratio"  label="OUT/IN" />
              <SortBtn k="cost_per_call" label="$/CALL" />
              <th className="pb-2.5 font-medium text-right">DOM %</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, i) => (
              <tr key={m.model} className="border-b border-[#1A1B1F]/60 last:border-0 hover:bg-white/[0.02] transition-colors">
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-2">
                    {/* dominance bar */}
                    <div className="w-1 h-6 rounded-full bg-[#1A1B1F] overflow-hidden">
                      <div className="w-full bg-purple-500 rounded-full" style={{ height: `${m.dominance}%` }} />
                    </div>
                    <div>
                      <div className="font-bold text-white truncate max-w-[140px]">{m.model}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[8px] uppercase text-[#8E9299]">{m.provider}</span>
                        {m.isLocal && <span className="text-[8px] text-blue-400 bg-blue-500/10 px-1 rounded">local</span>}
                        {i === 0 && <span className="text-[8px] text-amber-400 bg-amber-500/10 px-1 rounded">top</span>}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-2.5 text-right text-white font-bold">
                  {m.total > 1e6 ? `${(m.total/1e6).toFixed(1)}M` : m.total.toLocaleString('pt-BR')}
                </td>
                <td className="py-2.5 text-right text-[#8E9299]">{m.calls.toLocaleString('pt-BR')}</td>
                <td className="py-2.5 text-right text-[#8E9299]">
                  {m.avgTokens > 1000 ? `${(m.avgTokens/1000).toFixed(1)}K` : m.avgTokens.toFixed(0)}
                </td>
                <td className="py-2.5 text-right">
                  <span className={clsx('font-bold', m.outputRatio > 0.5 ? 'text-green-400' : m.outputRatio > 0.2 ? 'text-yellow-400' : 'text-red-400')}>
                    {m.outputRatio.toFixed(2)}
                  </span>
                </td>
                <td className="py-2.5 text-right text-[#8E9299]">
                  {m.costPerCall > 0 ? `$${m.costPerCall.toFixed(4)}` : '—'}
                </td>
                <td className="py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <div className="w-12 h-1 bg-[#1A1B1F] rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${m.dominance}%` }} />
                    </div>
                    <span className={clsx('font-bold', m.dominance > 60 ? 'text-amber-400' : 'text-[#8E9299]')}>
                      {m.dominance.toFixed(0)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#2A2B30]">
              <td className="pt-2.5 font-bold text-[#8E9299]">TOTAL</td>
              <td className="pt-2.5 text-right font-black text-white">
                {totalTokens > 1e9 ? `${(totalTokens/1e9).toFixed(2)}B` : totalTokens > 1e6 ? `${(totalTokens/1e6).toFixed(1)}M` : totalTokens.toLocaleString('pt-BR')}
              </td>
              <td className="pt-2.5 text-right font-bold text-white">{totalCalls.toLocaleString('pt-BR')}</td>
              <td colSpan={4} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
