import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TokenUsage } from '../types';

interface CostEfficiencyChartProps {
  usage?: TokenUsage;
  className?: string;
}

export function CostEfficiencyChart({ usage, className }: CostEfficiencyChartProps) {
  if (!usage || !usage.per_model) return null;

  // Simple cost estimation (mock prices)
  const data = usage.per_model.map(m => {
    // Mock pricing: GPT-4 ($30/M in, $60/M out), Claude ($15/M in, $75/M out), Llama (Cheap)
    let costPerMInput = 10;
    let costPerMOutput = 30;
    
    if (m.model.includes('gpt-4')) { costPerMInput = 30; costPerMOutput = 60; }
    else if (m.model.includes('claude')) { costPerMInput = 15; costPerMOutput = 75; }
    else if (m.model.includes('llama')) { costPerMInput = 0.5; costPerMOutput = 1; }

    const cost = (m.input / 1000000 * costPerMInput) + (m.output / 1000000 * costPerMOutput);
    
    return {
      name: m.model,
      tokens: m.total,
      cost: parseFloat(cost.toFixed(4)),
      efficiency: (m.total / (cost || 0.0001)).toFixed(0) // Tokens per dollar
    };
  });

  return (
    <div className={twMerge("bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm", className)}>
      <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider mb-4">Cost vs. Efficiency Matrix</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2B30" />
            <XAxis 
              type="number" 
              dataKey="cost" 
              name="Est. Cost ($)" 
              unit="$" 
              stroke="#8E9299" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              label={{ value: 'Estimated Cost ($)', position: 'bottom', offset: 0, fill: '#8E9299', fontSize: 10 }}
            />
            <YAxis 
              type="number" 
              dataKey="tokens" 
              name="Total Tokens" 
              unit="" 
              stroke="#8E9299" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              label={{ value: 'Total Tokens', angle: -90, position: 'insideLeft', fill: '#8E9299', fontSize: 10 }}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }} 
              contentStyle={{ backgroundColor: '#1A1B1F', border: '1px solid #2A2B30', borderRadius: '4px' }}
              itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
              labelStyle={{ color: '#8E9299', marginBottom: '4px' }}
            />
            <Scatter name="Models" data={data} fill="#8884d8">
              <LabelList dataKey="name" position="top" style={{ fill: '#8E9299', fontSize: '10px', fontFamily: 'monospace' }} />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
