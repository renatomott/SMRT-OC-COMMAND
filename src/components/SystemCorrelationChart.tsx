import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TelemetryData } from '../types';

interface SystemCorrelationChartProps {
  history: any[];
  cronJobs?: TelemetryData['openclaw']['rich']['cron_jobs'];
  className?: string;
}

export function SystemCorrelationChart({ history, cronJobs, className }: SystemCorrelationChartProps) {
  if (!history || history.length === 0) return null;

  // Find cron job runs in the history window
  // This is a simplification; in reality, we'd match timestamps precisely
  // For now, we'll just mark the latest run if it falls within the window
  const markers = cronJobs?.jobs?.map(job => {
    // Parse "10 mins ago" or similar relative time to a timestamp if possible
    // Since we don't have real timestamps for cron runs in the mock data, 
    // we'll simulate markers for demonstration purposes based on the job schedule
    return {
      label: job.command,
      time: history[Math.floor(Math.random() * history.length)]?.timestamp // Random placement for demo
    };
  }) || [];

  return (
    <div className={twMerge("bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm", className)}>
      <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider mb-4">System Load vs. AI Activity Correlation</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history}>
            <defs>
              <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2B30" vertical={false} />
            <XAxis 
              dataKey="timestamp" 
              stroke="#8E9299" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
            />
            <YAxis 
              yAxisId="left"
              stroke="#8E9299" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              label={{ value: 'CPU %', angle: -90, position: 'insideLeft', fill: '#8884d8', fontSize: 10 }}
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              stroke="#8E9299" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              label={{ value: 'Tokens', angle: 90, position: 'insideRight', fill: '#82ca9d', fontSize: 10 }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1A1B1F', border: '1px solid #2A2B30', borderRadius: '4px' }}
              itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
              labelStyle={{ color: '#8E9299', marginBottom: '4px' }}
            />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="cpu" 
              stroke="#8884d8" 
              fillOpacity={1} 
              fill="url(#colorCpu)" 
              name="CPU Usage"
            />
            {/* Simulated token data since history doesn't have it yet */}
            <Area 
              yAxisId="right"
              type="monotone" 
              dataKey="tokens" 
              stroke="#82ca9d" 
              fillOpacity={1} 
              fill="url(#colorTokens)" 
              name="Token Usage"
            />
            
            {markers.map((marker, i) => (
              <ReferenceLine 
                key={i} 
                x={marker.time} 
                stroke="red" 
                strokeDasharray="3 3" 
                label={{ position: 'top', value: 'CRON', fill: 'red', fontSize: 10 }} 
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
