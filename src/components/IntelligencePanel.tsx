import React, { useState } from 'react';
import { clsx } from 'clsx';
import { AlertTriangle, CheckCircle, Info, XCircle, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { Insight, InsightSeverity } from '../lib/insightEngine';

interface IntelligencePanelProps {
  insights: Insight[];
  className?: string;
}

const SEVERITY_CONFIG: Record<InsightSeverity, {
  icon: React.ElementType; color: string; bg: string; border: string; label: string;
}> = {
  critical: { icon: XCircle,       color: 'text-red-400',    bg: 'bg-red-500/8',    border: 'border-red-500/25',    label: 'CRÍTICO' },
  warning:  { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/8', border: 'border-yellow-500/25', label: 'ATENÇÃO' },
  info:     { icon: Info,          color: 'text-blue-400',   bg: 'bg-blue-500/5',   border: 'border-blue-500/20',   label: 'INFO' },
  good:     { icon: CheckCircle,   color: 'text-green-400',  bg: 'bg-green-500/8',  border: 'border-green-500/20',  label: 'OK' },
};

export function IntelligencePanel({ insights, className }: IntelligencePanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [filter, setFilter] = useState<InsightSeverity | 'all'>('all');

  const critCount = insights.filter(i => i.severity === 'critical').length;
  const warnCount = insights.filter(i => i.severity === 'warning').length;

  const filtered = filter === 'all' ? insights : insights.filter(i => i.severity === filter);

  return (
    <div className={clsx('bg-[#0E0F11] border rounded-xl overflow-hidden', 
      critCount > 0 ? 'border-red-500/30' : warnCount > 0 ? 'border-yellow-500/25' : 'border-[#1E2030]',
      className)}>
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2.5">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E9299]">Insights Automáticos</span>
          <div className="flex items-center gap-1.5 ml-1">
            {critCount > 0 && <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">{critCount} crit</span>}
            {warnCount > 0 && <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-400">{warnCount} warn</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#8E9299]">{insights.length} detectados</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-[#8E9299]" /> : <ChevronDown className="w-4 h-4 text-[#8E9299]" />}
        </div>
      </div>

      {expanded && (
        <>
          {/* Filter bar */}
          <div className="flex items-center gap-1 px-4 pb-3 border-t border-[#1A1B1F] pt-3">
            {(['all', 'critical', 'warning', 'info', 'good'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx('px-2.5 py-1 rounded text-[10px] font-mono uppercase font-bold transition-colors', {
                  'bg-white/10 text-white': filter === f,
                  'text-[#8E9299] hover:text-white': filter !== f,
                })}
              >
                {f === 'all' ? `todos (${insights.length})` : 
                 f === 'critical' ? `crit (${critCount})` :
                 f === 'warning' ? `warn (${warnCount})` :
                 f === 'info' ? `info (${insights.filter(i=>i.severity==='info').length})` :
                 `ok (${insights.filter(i=>i.severity==='good').length})`}
              </button>
            ))}
          </div>

          {/* Insight list */}
          <div className="space-y-1 px-3 pb-3 max-h-[320px] overflow-y-auto">
            {filtered.map(insight => {
              const cfg = SEVERITY_CONFIG[insight.severity];
              const Icon = cfg.icon;
              return (
                <div key={insight.id} className={clsx(
                  'flex items-start gap-3 px-3 py-2.5 rounded-lg border transition-colors',
                  cfg.bg, cfg.border
                )}>
                  <Icon className={clsx('w-3.5 h-3.5 mt-0.5 shrink-0', cfg.color)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={clsx('text-[11px] font-mono font-bold', cfg.color)}>{insight.title}</span>
                      {insight.metric && (
                        <span className={clsx('text-[10px] font-mono font-black shrink-0', cfg.color)}>{insight.metric}</span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-[#8E9299] mt-0.5 leading-relaxed">{insight.detail}</p>
                  </div>
                  <span className={clsx('text-[8px] font-mono uppercase font-bold px-1.5 py-0.5 rounded shrink-0 mt-0.5', cfg.bg, cfg.color, 'border', cfg.border)}>
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
