import React, { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
import { Terminal, ChevronUp, ChevronDown } from 'lucide-react';
import { OpenClawProcess } from '../types';

interface ProcessTableProps {
  processes: OpenClawProcess[];
  className?: string;
}

type SortKey = 'pid' | 'name' | 'cpu_pct' | 'mem_mb' | 'status';

export function ProcessTable({ processes, className }: ProcessTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('cpu_pct');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  if (!processes || processes.length === 0) {
    return (
      <div className={twMerge('bg-[#151619] border border-[#2A2B30] rounded-lg p-4', className)}>
        <div className="flex items-center gap-2 mb-4">
          <Terminal className="w-4 h-4 text-[#8E9299]" />
          <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider">Processos Monitorados</h3>
        </div>
        <p className="text-[#8E9299] text-xs font-mono italic">Nenhum processo encontrado</p>
      </div>
    );
  }

  const sorted = [...processes].sort((a, b) => {
    const av = (a as any)[sortKey] ?? 0;
    const bv = (b as any)[sortKey] ?? 0;
    if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };
  const setDir = setSortDir;

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? sortDir === 'desc' ? <ChevronDown className="w-3 h-3 inline ml-0.5" /> : <ChevronUp className="w-3 h-3 inline ml-0.5" />
      : null;

  return (
    <div className={twMerge('bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#8E9299]" />
          <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider">Processos Monitorados</h3>
        </div>
        <span className="text-[#8E9299] text-xs font-mono">{processes.length} processos</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-[#2A2B30] text-[#8E9299]">
              {([
                ['pid', 'PID'],
                ['name', 'PROCESSO'],
                ['status', 'STATUS'],
                ['cpu_pct', 'CPU%'],
                ['mem_mb', 'MEM (MB)'],
              ] as [SortKey, string][]).map(([k, label]) => (
                <th
                  key={k}
                  className="pb-2 font-normal cursor-pointer hover:text-white select-none"
                  onClick={() => toggleSort(k)}
                >
                  {label}<SortIcon k={k} />
                </th>
              ))}
              <th className="pb-2 font-normal">CMDLINE</th>
              <th className="pb-2 font-normal">INICIADO</th>
            </tr>
          </thead>
          <tbody className="text-white">
            {sorted.map((p, i) => {
              const cpu = p.cpu_pct ?? (p as any).cpu ?? 0;
              const mem = p.mem_mb ?? (p as any).memory ?? 0;
              return (
                <tr key={p.pid ?? i} className="border-b border-[#2A2B30] last:border-0 hover:bg-[#1E1F23] transition-colors">
                  <td className="py-2 text-[#8E9299]">{p.pid ?? '—'}</td>
                  <td className="py-2 font-bold text-white">{p.name}</td>
                  <td className="py-2">
                    <span className={clsx('px-2 py-0.5 rounded text-[10px] uppercase font-bold', {
                      'bg-green-500/10 text-green-400': p.status === 'running',
                      'bg-yellow-500/10 text-yellow-400': p.status === 'sleeping',
                      'bg-red-500/10 text-red-400': p.status === 'stopped' || p.status === 'zombie',
                      'bg-[#2A2B30] text-[#8E9299]': !['running','sleeping','stopped','zombie'].includes(p.status || ''),
                    })}>
                      {p.status || '—'}
                    </span>
                  </td>
                  <td className={clsx('py-2', { 'text-red-400': cpu > 80, 'text-yellow-400': cpu > 40 && cpu <= 80, 'text-[#8E9299]': cpu <= 40 })}>
                    {cpu.toFixed(1)}%
                  </td>
                  <td className="py-2 text-[#8E9299]">{mem > 0 ? mem.toFixed(0) : '—'}</td>
                  <td className="py-2 text-[#8E9299] max-w-[180px] truncate" title={p.cmdline}>{p.cmdline || '—'}</td>
                  <td className="py-2 text-[#8E9299]">{p.started ? new Date(p.started).toLocaleTimeString('pt-BR') : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
