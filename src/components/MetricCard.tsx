import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  className?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export function MetricCard({ title, value, unit, icon, className, trend, trendValue }: MetricCardProps) {
  return (
    <div className={twMerge("bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm", className)}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider">{title}</h3>
        {icon && <div className="text-[#8E9299]">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-white text-2xl font-mono font-bold">{value}</span>
        {unit && <span className="text-[#8E9299] text-sm font-mono">{unit}</span>}
      </div>
      {trend && (
        <div className={clsx("flex items-center mt-2 text-xs font-mono", {
          "text-green-500": trend === 'up',
          "text-red-500": trend === 'down',
          "text-[#8E9299]": trend === 'neutral'
        })}>
          <span>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}</span>
          <span className="ml-1">{trendValue}</span>
        </div>
      )}
    </div>
  );
}
