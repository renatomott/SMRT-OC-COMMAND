import React from 'react';
import { clsx } from 'clsx';
import { MemoryStick } from 'lucide-react';

interface MemoryPressureWidgetProps {
  totalGb: number;
  usedGb: number;
  availableGb: number;
  swapTotalGb?: number;
  swapUsedGb?: number;
  swapPct?: number;
  topProcesses?: Array<{ name: string; mem_pct: number; cpu_pct: number }>;
  className?: string;
}

export function MemoryPressureWidget({
  totalGb, usedGb, availableGb, swapTotalGb = 0, swapUsedGb = 0, swapPct = 0, topProcesses = [], className
}: MemoryPressureWidgetProps) {
  const usedPct = totalGb > 0 ? (usedGb / totalGb) * 100 : 0;
  const freePct = totalGb > 0 ? (availableGb / totalGb) * 100 : 0;
  const cachedPct = Math.max(0, 100 - usedPct - freePct);

  const pressureLevel = swapUsedGb > 1 ? 'high' : usedPct > 85 ? 'medium' : 'low';

  // Top 5 processes by memory
  const topMem = [...topProcesses]
    .sort((a, b) => b.mem_pct - a.mem_pct)
    .slice(0, 4);

  return (
    <div className={clsx('bg-[#0E0F11] border border-[#1E2030] rounded-xl p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MemoryStick className="w-4 h-4 text-[#8E9299]" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E9299]">Memória</span>
        </div>
        <span className={clsx('text-[10px] font-mono font-bold uppercase', {
          'text-red-400': pressureLevel === 'high',
          'text-yellow-400': pressureLevel === 'medium',
          'text-green-400': pressureLevel === 'low',
        })}>
          {pressureLevel === 'high' ? '⚠ PRESSÃO' : pressureLevel === 'medium' ? '~ ATENÇÃO' : '✓ OK'}
        </span>
      </div>

      {/* Main bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[9px] font-mono text-[#8E9299] mb-1">
          <span>{usedGb.toFixed(1)} GB usado</span>
          <span>{totalGb.toFixed(1)} GB total</span>
        </div>
        <div className="h-4 bg-[#1A1B1F] rounded-md overflow-hidden flex">
          <div className="bg-purple-500 h-full transition-all duration-700" style={{ width: `${usedPct}%` }} title={`Usado: ${usedPct.toFixed(1)}%`} />
          <div className="bg-blue-500/40 h-full transition-all duration-700" style={{ width: `${cachedPct}%` }} title={`Cache: ${cachedPct.toFixed(1)}%`} />
          {/* free is the remainder */}
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-[8px] font-mono text-[#8E9299]">
          <span><span className="inline-block w-2 h-2 rounded-sm bg-purple-500 mr-1" />Usado {usedPct.toFixed(0)}%</span>
          <span><span className="inline-block w-2 h-2 rounded-sm bg-blue-500/40 mr-1" />Cache {cachedPct.toFixed(0)}%</span>
          <span><span className="inline-block w-2 h-2 rounded-sm bg-[#2A2B30] mr-1" />Livre {freePct.toFixed(0)}%</span>
        </div>
      </div>

      {/* Swap bar */}
      {swapTotalGb > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-[9px] font-mono mb-1">
            <span className="text-[#8E9299]">Swap</span>
            <span className={clsx(swapUsedGb > 0.5 ? 'text-red-400 font-bold' : 'text-[#8E9299]')}>
              {swapUsedGb.toFixed(1)} / {swapTotalGb.toFixed(1)} GB ({swapPct.toFixed(0)}%)
            </span>
          </div>
          <div className="h-2 bg-[#1A1B1F] rounded-full overflow-hidden">
            <div
              className={clsx('h-full rounded-full transition-all duration-700', swapPct > 30 ? 'bg-red-500' : 'bg-orange-500/60')}
              style={{ width: `${swapPct}%` }}
            />
          </div>
          {swapUsedGb > 0.1 && (
            <p className="text-[8px] font-mono text-red-400 mt-1">
              Sistema usando disco como RAM — performance reduzida
            </p>
          )}
        </div>
      )}

      {/* Top processes */}
      {topMem.length > 0 && (
        <div>
          <div className="text-[9px] font-mono uppercase text-[#8E9299] mb-1.5 tracking-wider">Top processos (RAM)</div>
          <div className="space-y-1">
            {topMem.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-[#8E9299] w-4 text-right">{i+1}.</span>
                <span className="text-[9px] font-mono text-white truncate flex-1">{p.name}</span>
                <div className="w-16 h-1 bg-[#1A1B1F] rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500/70 rounded-full" style={{ width: `${Math.min(p.mem_pct, 100)}%` }} />
                </div>
                <span className="text-[9px] font-mono text-purple-400 font-bold w-8 text-right">{p.mem_pct.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
