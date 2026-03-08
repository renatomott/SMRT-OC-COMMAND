import React, { useState } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine, Brush
} from 'recharts';
import { clsx } from 'clsx';

interface MultiTimelineProps {
  history: any[]; // enriched history from snapshots
  cronJobs?: any;
  className?: string;
}

const METRICS = [
  { key: 'cpu',    label: 'CPU %',     color: '#3b82f6', type: 'area' },
  { key: 'memory', label: 'RAM %',     color: '#a78bfa', type: 'area' },
  { key: 'load1',  label: 'Load 1m',   color: '#f59e0b', type: 'line' },
  { key: 'net_recv_mb', label: 'Net ↓ MB', color: '#10b981', type: 'line' },
  { key: 'swap_pct',    label: 'Swap %',   color: '#ef4444', type: 'line' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0E0F11] border border-[#2A2B30] rounded-lg px-3 py-2 text-[10px] font-mono shadow-xl">
      <div className="text-[#8E9299] mb-1.5 font-bold">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-[#8E9299]">{p.name}</span>
          </div>
          <span className="font-bold" style={{ color: p.color }}>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

export function MultiTimeline({ history, cronJobs, className }: MultiTimelineProps) {
  const [activeMetrics, setActiveMetrics] = useState(new Set(['cpu', 'memory', 'load1']));

  const toggle = (key: string) => {
    setActiveMetrics(prev => {
      const next = new Set(prev);
      if (next.has(key)) { if (next.size > 1) next.delete(key); }
      else next.add(key);
      return next;
    });
  };

  if (!history || history.length < 2) return (
    <div className={clsx('bg-[#0E0F11] border border-[#1E2030] rounded-xl p-6 flex items-center justify-center', className)}>
      <span className="text-[#8E9299] font-mono text-xs">Aguardando histórico...</span>
    </div>
  );

  // Find cron reference lines — jobs that ran within the history window
  const cronMarkers: string[] = [];
  if (cronJobs?.jobs) {
    cronJobs.jobs.forEach((job: any) => {
      if (!job.last_run_at) return;
      const ts = new Date(job.last_run_at).getTime();
      const first = history[0]?._ts;
      const last = history[history.length - 1]?._ts;
      if (first && last && ts >= first && ts <= last) {
        const pt = history.find(h => Math.abs((h._ts || 0) - ts) < 90000);
        if (pt?.timestamp) cronMarkers.push(pt.timestamp);
      }
    });
  }

  return (
    <div className={clsx('bg-[#0E0F11] border border-[#1E2030] rounded-xl p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E9299]">
          Timeline — {history.length} snapshots
        </span>
        <div className="flex items-center gap-1 flex-wrap justify-end">
          {METRICS.map(m => (
            <button
              key={m.key}
              onClick={() => toggle(m.key)}
              className={clsx(
                'flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all border',
                activeMetrics.has(m.key)
                  ? 'border-transparent text-black'
                  : 'border-[#2A2B30] text-[#8E9299] bg-transparent'
              )}
              style={activeMetrics.has(m.key) ? { backgroundColor: m.color } : {}}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={history} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              {METRICS.filter(m => m.type === 'area').map(m => (
                <linearGradient key={m.key} id={`grad-${m.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={m.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={m.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1A1B1F" vertical={false} />
            <XAxis
              dataKey="timestamp"
              stroke="#2A2B30"
              tick={{ fill: '#8E9299', fontSize: 9, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
              interval={Math.max(1, Math.floor(history.length / 6))}
            />
            <YAxis
              stroke="#2A2B30"
              tick={{ fill: '#8E9299', fontSize: 9, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={v => `${v}`}
            />
            <Tooltip content={<CustomTooltip />} />

            {cronMarkers.map((ts, i) => (
              <ReferenceLine
                key={i} x={ts}
                stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.5}
                label={{ value: '⚡', position: 'top', fontSize: 10 }}
              />
            ))}

            {METRICS.filter(m => activeMetrics.has(m.key)).map(m =>
              m.type === 'area' ? (
                <Area
                  key={m.key}
                  type="monotone"
                  dataKey={m.key}
                  name={m.label}
                  stroke={m.color}
                  strokeWidth={1.5}
                  fill={`url(#grad-${m.key})`}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              ) : (
                <Line
                  key={m.key}
                  type="monotone"
                  dataKey={m.key}
                  name={m.label}
                  stroke={m.color}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              )
            )}

            {history.length > 20 && (
              <Brush
                dataKey="timestamp"
                height={18}
                stroke="#2A2B30"
                fill="#0E0F11"
                travellerWidth={6}
                startIndex={Math.max(0, history.length - 40)}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Min/Max/Avg summary */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#1A1B1F]">
        {['cpu', 'memory', 'load1'].map(key => {
          const vals = history.map(h => h[key]).filter(v => v != null && !isNaN(v));
          if (vals.length === 0) return null;
          const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
          const max = Math.max(...vals);
          const min = Math.min(...vals);
          const m = METRICS.find(m => m.key === key)!;
          return (
            <div key={key} className="bg-[#151619] rounded-lg px-3 py-2 border border-[#1A1B1F]">
              <div className="text-[9px] font-mono uppercase mb-1" style={{ color: m.color }}>{m.label}</div>
              <div className="grid grid-cols-3 gap-1 text-[9px] font-mono">
                <div><span className="text-[#8E9299]">min </span><span className="text-white">{min.toFixed(1)}</span></div>
                <div><span className="text-[#8E9299]">avg </span><span className="font-bold" style={{ color: m.color }}>{avg.toFixed(1)}</span></div>
                <div><span className="text-[#8E9299]">max </span><span className="text-white">{max.toFixed(1)}</span></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
