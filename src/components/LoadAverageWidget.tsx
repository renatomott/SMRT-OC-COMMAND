import React from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { loadTrend } from '../lib/insightEngine';

interface LoadAverageWidgetProps {
  load1: number;
  load5: number;
  load15: number;
  physicalCores?: number;
  className?: string;
}

export function LoadAverageWidget({ load1, load5, load15, physicalCores = 1, className }: LoadAverageWidgetProps) {
  const trend = loadTrend(load1, load5, load15);
  const maxLoad = Math.max(load1, load5, load15, physicalCores) * 1.1 || 1;
  
  // Normalize: load = physicalCores means 100% utilized
  const pct1  = Math.min((load1  / physicalCores) * 100, 150);
  const pct5  = Math.min((load5  / physicalCores) * 100, 150);
  const pct15 = Math.min((load15 / physicalCores) * 100, 150);

  const barColor = (pct: number) =>
    pct > 100 ? 'bg-red-500' : pct > 75 ? 'bg-yellow-500' : 'bg-blue-500';

  const TrendIcon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus;

  return (
    <div className={clsx('bg-[#0E0F11] border border-[#1E2030] rounded-xl p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#8E9299]" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E9299]">Load Average</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendIcon className="w-3.5 h-3.5" style={{ color: trend.color }} />
          <span className="text-[10px] font-mono font-bold" style={{ color: trend.color }}>{trend.label}</span>
        </div>
      </div>

      <div className="flex items-end gap-3 mb-3">
        {[
          { label: '1m', value: load1, pct: pct1 },
          { label: '5m', value: load5, pct: pct5 },
          { label: '15m', value: load15, pct: pct15 },
        ].map(({ label, value, pct }) => (
          <div key={label} className="flex-1 flex flex-col items-center gap-1">
            <span className={clsx('text-sm font-black font-mono', pct > 100 ? 'text-red-400' : pct > 75 ? 'text-yellow-400' : 'text-white')}>
              {value.toFixed(2)}
            </span>
            <div className="w-full h-16 bg-[#151619] rounded relative overflow-hidden flex items-end">
              <div
                className={clsx('w-full rounded transition-all duration-700', barColor(pct))}
                style={{ height: `${Math.min(pct, 100)}%`, opacity: 0.85 }}
              />
              {pct > 100 && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 animate-pulse" />
              )}
            </div>
            <span className="text-[9px] font-mono text-[#8E9299] uppercase">{label}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-[9px] font-mono text-[#8E9299] border-t border-[#1A1B1F] pt-2">
        <span>{physicalCores} cores físicos</span>
        <span className={clsx('font-bold', pct1 > 100 ? 'text-red-400' : pct1 > 75 ? 'text-yellow-400' : 'text-green-400')}>
          {((load1 / physicalCores) * 100).toFixed(0)}% utilização
        </span>
      </div>
    </div>
  );
}
