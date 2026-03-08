import React from 'react';
import { clsx } from 'clsx';
import { SystemHealthScore as ScoreData } from '../lib/insightEngine';
import { Shield, CheckCircle, XCircle } from 'lucide-react';

interface SystemHealthScoreProps {
  score: ScoreData;
  className?: string;
}

const GRADE_CONFIG = {
  A: { color: 'text-green-400',  ring: 'stroke-green-500',  bg: 'bg-green-500',  label: 'Excelente' },
  B: { color: 'text-blue-400',   ring: 'stroke-blue-500',   bg: 'bg-blue-500',   label: 'Bom' },
  C: { color: 'text-yellow-400', ring: 'stroke-yellow-500', bg: 'bg-yellow-500', label: 'Regular' },
  D: { color: 'text-orange-400', ring: 'stroke-orange-500', bg: 'bg-orange-500', label: 'Ruim' },
  F: { color: 'text-red-400',    ring: 'stroke-red-500',    bg: 'bg-red-500',    label: 'Crítico' },
};

export function SystemHealthScore({ score, className }: SystemHealthScoreProps) {
  const cfg = GRADE_CONFIG[score.grade];
  const circumference = 2 * Math.PI * 38; // r=38
  const offset = circumference - (score.score / 100) * circumference;

  return (
    <div className={clsx('bg-[#0E0F11] border border-[#1E2030] rounded-xl p-4', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4 text-[#8E9299]" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E9299]">Saúde do Sistema</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Radial gauge */}
        <div className="relative shrink-0 w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 90 90">
            {/* Track */}
            <circle cx="45" cy="45" r="38" fill="none" stroke="#1E2030" strokeWidth="7" />
            {/* Progress */}
            <circle
              cx="45" cy="45" r="38" fill="none"
              className={clsx(cfg.ring, 'transition-all duration-1000')}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={clsx('text-2xl font-black font-mono leading-none', cfg.color)}>{score.score}</span>
            <span className={clsx('text-xs font-mono font-bold', cfg.color)}>{score.grade}</span>
          </div>
        </div>

        {/* Factors */}
        <div className="flex-1 space-y-1.5">
          <div className={clsx('text-[11px] font-mono font-bold mb-2', cfg.color)}>{cfg.label}</div>
          {score.factors.map(f => (
            <div key={f.label} className="flex items-center gap-2">
              <div className={clsx('w-1.5 h-1.5 rounded-full shrink-0', f.ok ? 'bg-green-500' : 'bg-red-500')} />
              <span className="text-[10px] font-mono text-[#8E9299] w-14 shrink-0">{f.label}</span>
              <div className="flex-1 h-1 bg-[#1A1B1F] rounded-full overflow-hidden">
                <div
                  className={clsx('h-full rounded-full transition-all duration-700', f.ok ? 'bg-green-500' : 'bg-red-500')}
                  style={{ width: `${f.value}%` }}
                />
              </div>
              <span className={clsx('text-[9px] font-mono font-bold w-7 text-right', f.ok ? 'text-green-400' : 'text-red-400')}>
                {f.value.toFixed(0)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
