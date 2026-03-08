import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TokenUsage, LLMData } from '../types';
import { Brain, Zap, DollarSign, Layers, Database } from 'lucide-react';

interface LLMAnalyticsProps {
  usage?: TokenUsage;
  models?: LLMData[];
  className?: string;
}

export function LLMAnalytics({ usage, models, className }: LLMAnalyticsProps) {
  if (!usage && (!models || models.length === 0)) {
    return (
      <div className={twMerge("bg-[#151619] border border-[#2A2B30] rounded-lg p-8 text-center", className)}>
        <Brain className="w-12 h-12 text-[#2A2B30] mx-auto mb-4" />
        <h3 className="text-[#8E9299] font-mono">No LLM data available</h3>
      </div>
    );
  }

  const data = usage?.per_model?.map(m => ({
    name: m.model,
    value: m.total,
    input: m.input,
    output: m.output
  })) || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <div className={twMerge("space-y-6", className)}>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#151619] border border-[#2A2B30] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-blue-500" />
            <span className="text-[#8E9299] text-xs font-mono uppercase">Total Tokens</span>
          </div>
          <p className="text-2xl font-bold font-mono text-white">{usage?.total_tokens?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-[#151619] border border-[#2A2B30] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-[#8E9299] text-xs font-mono uppercase">Prompt Tokens</span>
          </div>
          <p className="text-2xl font-bold font-mono text-white">{usage?.total_input?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-[#151619] border border-[#2A2B30] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-purple-500" />
            <span className="text-[#8E9299] text-xs font-mono uppercase">Completion Tokens</span>
          </div>
          <p className="text-2xl font-bold font-mono text-white">{usage?.total_output?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-[#151619] border border-[#2A2B30] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-500" />
            <span className="text-[#8E9299] text-xs font-mono uppercase">Active Models</span>
          </div>
          <p className="text-2xl font-bold font-mono text-white">{data.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribution Chart */}
        <div className="bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm lg:col-span-1">
          <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider mb-4">Token Distribution</h3>
          {/* Donut chart — full width, legend below */}
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0E0F11', border: '1px solid #2A2B30', borderRadius: '6px', fontSize: 11, fontFamily: 'monospace' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number, name: string) => [value.toLocaleString('pt-BR'), name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Custom legend — grid to avoid overflow */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 max-h-28 overflow-y-auto pr-1">
            {data.map((entry, i) => {
              const shortName = entry.name.replace('openrouter/', '').replace('meta-llama/', 'llama/');
              return (
                <div key={i} className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[9px] font-mono text-[#8E9299] truncate" title={entry.name}>{shortName}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Usage Table */}
        <div className="bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm lg:col-span-2">
          <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider mb-4">Usage by Model</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-[#2A2B30] text-[#8E9299]">
                  <th className="pb-2 font-normal">MODEL</th>
                  <th className="pb-2 font-normal text-right">INPUT</th>
                  <th className="pb-2 font-normal text-right">OUTPUT</th>
                  <th className="pb-2 font-normal text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {data.map((row, i) => (
                  <tr key={i} className="border-b border-[#2A2B30] last:border-0 hover:bg-[#1E1F23] transition-colors">
                    <td className="py-2 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                      {row.name}
                    </td>
                    <td className="py-2 text-right text-[#8E9299]">{row.input.toLocaleString()}</td>
                    <td className="py-2 text-right text-[#8E9299]">{row.output.toLocaleString()}</td>
                    <td className="py-2 text-right font-bold">{row.value.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Model Catalog */}
      <div className="bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-[#8E9299]" />
          <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider">Model Catalog</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[#2A2B30] text-[#8E9299]">
                <th className="pb-2 font-normal">NAME</th>
                <th className="pb-2 font-normal">PROVIDER</th>
                <th className="pb-2 font-normal">STATE</th>
                <th className="pb-2 font-normal text-right">CONTEXT WINDOW</th>
                <th className="pb-2 font-normal text-right">MAX TOKENS</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {models && models.length > 0 ? (
                models.map((model, i) => (
                  <tr key={i} className="border-b border-[#2A2B30] last:border-0 hover:bg-[#1E1F23] transition-colors">
                    <td className="py-2 font-bold">{model.name}</td>
                    <td className="py-2 text-[#8E9299]">{model.provider}</td>
                    <td className="py-2">
                      <span className={clsx("px-1.5 py-0.5 rounded text-[10px] uppercase", {
                        "bg-green-500/10 text-green-500": model.state === 'online' || model.state === 'active',
                        "bg-yellow-500/10 text-yellow-500": model.state === 'maintenance',
                        "bg-red-500/10 text-red-500": model.state === 'offline',
                        "bg-gray-500/10 text-gray-500": !['online', 'active', 'maintenance', 'offline'].includes(model.state)
                      })}>
                        {model.state}
                      </span>
                    </td>
                    <td className="py-2 text-right text-[#8E9299]">{model.context_window ? model.context_window.toLocaleString() : '-'}</td>
                    <td className="py-2 text-right text-[#8E9299]">{model.max_tokens ? model.max_tokens.toLocaleString() : '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-[#8E9299] italic">No models found in catalog</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
