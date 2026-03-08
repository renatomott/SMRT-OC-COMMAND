import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TelemetryData } from '../types';

interface DiskForecastProps {
  history: any[];
  currentDisk?: number;
  className?: string;
}

export function DiskForecast({ history, currentDisk, className }: DiskForecastProps) {
  if (!history || history.length < 2) return null;

  // Simple linear regression to forecast when disk reaches 100%
  // y = mx + c
  // x = time (index), y = disk usage
  const n = history.length;
  const sumX = history.reduce((acc, _, i) => acc + i, 0);
  const sumY = history.reduce((acc, h) => acc + h.disk, 0);
  const sumXY = history.reduce((acc, h, i) => acc + (i * h.disk), 0);
  const sumXX = history.reduce((acc, _, i) => acc + (i * i), 0);

  // Calculate slope (m) and intercept (c)
  // Avoid division by zero if n is small or sumXX equals sumX^2/n
  const denominator = (n * sumXX - sumX * sumX);
  if (denominator === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Forecast next 20 points
  const forecastData = history.map((h, i) => ({
    name: h.timestamp,
    disk: h.disk,
    isForecast: false
  }));

  let daysToFull = -1;
  const lastIndex = n - 1;

  if (slope > 0) {
    for (let i = 1; i <= 20; i++) {
      const nextIndex = lastIndex + i;
      const predictedUsage = slope * nextIndex + intercept;
      
      if (predictedUsage >= 100 && daysToFull === -1) {
        daysToFull = i; // Rough estimate of intervals until full
      }
      
      forecastData.push({
        name: `+${i * 5}m`, // Assuming 5 min intervals for label
        disk: Math.min(Math.max(predictedUsage, 0), 100),
        isForecast: true
      });
    }
  }

  return (
    <div className={twMerge("bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm", className)}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider">Disk Usage Forecast</h3>
        {daysToFull > 0 ? (
          <span className="text-red-500 text-xs font-bold font-mono animate-pulse">
            CRITICAL: FULL IN ~{daysToFull * 5} MINS
          </span>
        ) : slope <= 0 ? (
          <span className="text-green-500 text-xs font-bold font-mono">STABLE / DECREASING</span>
        ) : (
          <span className="text-yellow-500 text-xs font-bold font-mono">INCREASING SLOWLY</span>
        )}
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={forecastData}>
            <defs>
              <linearGradient id="colorDiskForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2B30" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#8E9299" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#8E9299" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1A1B1F', border: '1px solid #2A2B30', borderRadius: '4px' }}
              itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
              labelStyle={{ color: '#8E9299', marginBottom: '4px' }}
            />
            <ReferenceLine y={90} stroke="red" strokeDasharray="3 3" label={{ value: 'CRITICAL', position: 'insideTopRight', fill: 'red', fontSize: 10 }} />
            <Area 
              type="monotone" 
              dataKey="disk" 
              stroke="#F59E0B" 
              fillOpacity={1} 
              fill="url(#colorDiskForecast)" 
              name="Disk Usage %"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
