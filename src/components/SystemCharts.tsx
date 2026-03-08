import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface SystemChartsProps {
  data: {
    timestamp: string;
    cpu: number;
    memory: number;
    disk: number;
  }[];
  className?: string;
}

export function SystemCharts({ data, className }: SystemChartsProps) {
  return (
    <div className={twMerge("bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm", className)}>
      <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider mb-4">System Performance</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="timestamp" stroke="#8E9299" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis stroke="#8E9299" fontSize={10} tickLine={false} axisLine={false} />
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2B30" vertical={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1A1B1F', border: '1px solid #2A2B30', borderRadius: '4px' }}
              itemStyle={{ color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}
              labelStyle={{ color: '#8E9299', fontSize: '10px', fontFamily: 'monospace' }}
            />
            <Area type="monotone" dataKey="cpu" stroke="#8884d8" fillOpacity={1} fill="url(#colorCpu)" name="CPU %" />
            <Area type="monotone" dataKey="memory" stroke="#82ca9d" fillOpacity={1} fill="url(#colorMemory)" name="Memory %" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
