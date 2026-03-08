import React from 'react';
import { twMerge } from 'tailwind-merge';
import { OpenClawProcess } from '../types';

interface ProcessTreemapProps {
  processes: OpenClawProcess[];
  className?: string;
}

function cpuColor(cpu: number): { fill: string; text: string } {
  if (cpu > 60) return { fill: '#ef4444', text: '#fff' };
  if (cpu > 30) return { fill: '#f59e0b', text: '#fff' };
  if (cpu > 10) return { fill: '#3b82f6', text: '#fff' };
  if (cpu > 2)  return { fill: '#1d4ed8', text: '#93c5fd' };
  return        { fill: '#181b26', text: '#6b7280' };
}

interface Block { name: string; cpu: number; mem: number; pid: number; x: number; y: number; w: number; h: number; }

function simpleLayout(items: { name: string; cpu: number; mem: number; pid: number }[], W: number, H: number): Block[] {
  if (!items.length) return [];
  const total = items.reduce((s, i) => s + Math.max(i.mem, 1), 0);
  const blocks: Block[] = [];
  let y = 0;
  let rowItems: typeof items = [];
  let rowTotal = 0;

  const flush = () => {
    if (!rowItems.length) return;
    const rH = (rowTotal / total) * H;
    let rx = 0;
    rowItems.forEach(item => {
      const w = (Math.max(item.mem, 1) / rowTotal) * W;
      blocks.push({ ...item, x: rx, y, w, h: rH });
      rx += w;
    });
    y += rH;
    rowItems = []; rowTotal = 0;
  };

  items.forEach((item, i) => {
    rowItems.push(item);
    rowTotal += Math.max(item.mem, 1);
    const projected = (rowTotal / total) * H;
    if (projected > H * 0.28 || i === items.length - 1) flush();
  });

  return blocks;
}

export function ProcessTreemap({ processes, className }: ProcessTreemapProps) {
  if (!processes || processes.length === 0) return null;

  const sorted = [...processes]
    .filter(p => (p.mem_mb || 0) > 0)
    .sort((a, b) => (b.mem_mb || 0) - (a.mem_mb || 0))
    .slice(0, 12);

  if (!sorted.length) return null;

  const W = 400, H = 220;
  const items = sorted.map(p => ({
    name: p.name, cpu: p.cpu_pct || (p as any).cpu || 0,
    mem: p.mem_mb || 0, pid: p.pid,
  }));
  const blocks = simpleLayout(items, W, H);

  return (
    <div className={twMerge('bg-[#0E0F11] border border-[#1E2030] rounded-xl p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[#8E9299] text-[10px] font-mono uppercase tracking-widest">Processos — área = RAM, cor = CPU</h3>
        <div className="flex items-center gap-2">
          {[['#181b26','idle'],['#1d4ed8','>2%'],['#3b82f6','>10%'],['#f59e0b','>30%'],['#ef4444','>60%']].map(([c, l]) => (
            <span key={l} className="flex items-center gap-1 text-[9px] font-mono text-[#8E9299]">
              <span className="w-2 h-2 rounded-sm border border-[#2A2B30]" style={{ backgroundColor: c }} />{l}
            </span>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg overflow-hidden" style={{ height: 200 }}>
        {blocks.map((b, i) => {
          const { fill, text } = cpuColor(b.cpu);
          const wide = b.w > 38, tall = b.h > 38;
          return (
            <g key={i}>
              <rect x={b.x+1} y={b.y+1} width={Math.max(b.w-2,0)} height={Math.max(b.h-2,0)} rx={3} fill={fill} opacity={0.92} />
              {wide && b.h > 22 && (
                <text x={b.x+b.w/2} y={b.y+b.h/2-(tall?8:0)} textAnchor="middle" dominantBaseline="middle"
                  fill={text} fontSize={Math.min(11, b.w/6)} fontFamily="monospace" fontWeight="bold">
                  {b.name.length > 10 ? b.name.slice(0,9)+'…' : b.name}
                </text>
              )}
              {wide && tall && (
                <text x={b.x+b.w/2} y={b.y+b.h/2+9} textAnchor="middle" dominantBaseline="middle"
                  fill={text} fontSize={9} fontFamily="monospace" opacity={0.7}>
                  {b.cpu.toFixed(1)}% · {b.mem > 1024 ? `${(b.mem/1024).toFixed(1)}G` : `${b.mem.toFixed(0)}M`}
                </text>
              )}
              <title>{b.name} · PID {b.pid} · {b.cpu.toFixed(1)}% CPU · {b.mem.toFixed(0)} MB RAM</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
