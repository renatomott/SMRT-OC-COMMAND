import React from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HeroMetricsProps {
  data: {
    cpu: number;
    mem: number;
    disk: number;
    totalTokens: number;
    sessions: number;
    apiStatus: boolean;
  };
  history: any[];
}

function Sparkline({ data, color, dataKey }: { data: any[]; color: string; dataKey: string }) {
  if (!data || data.length < 2) return <div className="h-10 opacity-20 bg-gradient-to-r from-transparent to-current rounded" style={{ color }} />;
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={data.slice(-20)}>
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5} dot={false} />
        <Tooltip
          contentStyle={{ backgroundColor: '#09090B', border: '1px solid #2A2B30', borderRadius: 4, fontSize: 10, fontFamily: 'monospace' }}
          itemStyle={{ color }}
          labelFormatter={() => ''}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function trend(history: any[], key: string): 'up' | 'down' | 'flat' {
  if (history.length < 3) return 'flat';
  const vals = history.slice(-5).map(h => h[key]).filter(v => v != null);
  if (vals.length < 2) return 'flat';
  const delta = vals[vals.length - 1] - vals[0];
  if (delta > 2) return 'up';
  if (delta < -2) return 'down';
  return 'flat';
}

interface HeroCardProps {
  label: string;
  value: string;
  sub?: string;
  color: string;
  bgColor: string;
  borderColor: string;
  history: any[];
  historyKey: string;
  trend: 'up' | 'down' | 'flat';
  trendGood?: 'up' | 'down'; // which direction is good
  badge?: { label: string; ok: boolean };
}

function HeroCard({ label, value, sub, color, bgColor, borderColor, history, historyKey, trend: t, trendGood, badge }: HeroCardProps) {
  const isGood = trendGood ? t === trendGood || t === 'flat' : true;
  const TrendIcon = t === 'up' ? TrendingUp : t === 'down' ? TrendingDown : Minus;
  const trendColor = t === 'flat' ? '#8E9299' : isGood ? '#22c55e' : '#ef4444';

  return (
    <div className={`relative bg-[#0E0F11] border ${borderColor} rounded-xl p-4 overflow-hidden flex flex-col justify-between min-h-[120px]`}>
      {/* Background glow */}
      <div className={`absolute inset-0 opacity-[0.04] ${bgColor} rounded-xl`} />

      <div className="relative flex items-start justify-between mb-1">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E9299]">{label}</span>
        <div className="flex items-center gap-1">
          {badge && (
            <span className={clsx('text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold', badge.ok ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400')}>
              {badge.label}
            </span>
          )}
          <TrendIcon className="w-3 h-3" style={{ color: trendColor }} />
        </div>
      </div>

      <div className="relative">
        <span className={`text-3xl font-black font-mono tracking-tight`} style={{ color }}>{value}</span>
        {sub && <div className="text-[10px] font-mono text-[#8E9299] mt-0.5">{sub}</div>}
      </div>

      <div className="relative -mx-1 mt-1">
        <Sparkline data={history} color={color} dataKey={historyKey} />
      </div>
    </div>
  );
}

export function HeroMetrics({ data, history }: HeroMetricsProps) {
  const cpuTrend = trend(history, 'cpu_pct');
  const memTrend = trend(history, 'mem_pct');

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      <HeroCard
        label="CPU"
        value={`${data.cpu.toFixed(1)}%`}
        color={data.cpu > 80 ? '#ef4444' : data.cpu > 60 ? '#f59e0b' : '#3b82f6'}
        bgColor="bg-blue-500"
        borderColor={data.cpu > 80 ? 'border-red-800/50' : 'border-[#1E2030]'}
        history={history}
        historyKey="cpu_pct"
        trend={cpuTrend}
        trendGood="down"
      />
      <HeroCard
        label="Memória"
        value={`${data.mem.toFixed(1)}%`}
        color={data.mem > 90 ? '#ef4444' : data.mem > 75 ? '#f59e0b' : '#a78bfa'}
        bgColor="bg-purple-500"
        borderColor={data.mem > 90 ? 'border-red-800/50' : 'border-[#1E2030]'}
        history={history}
        historyKey="mem_pct"
        trend={memTrend}
        trendGood="down"
      />
      <HeroCard
        label="Disco"
        value={`${data.disk.toFixed(1)}%`}
        sub="/Data (SSD interno)"
        color={data.disk > 90 ? '#ef4444' : data.disk > 75 ? '#f59e0b' : '#10b981'}
        bgColor="bg-emerald-500"
        borderColor="border-[#1E2030]"
        history={history}
        historyKey="disk_pct"
        trend="flat"
        trendGood="down"
      />
      <HeroCard
        label="Total Tokens"
        value={data.totalTokens > 1e9 ? `${(data.totalTokens / 1e9).toFixed(2)}B` : `${(data.totalTokens / 1e6).toFixed(1)}M`}
        color="#f59e0b"
        bgColor="bg-amber-500"
        borderColor="border-[#1E2030]"
        history={history}
        historyKey="total_tokens"
        trend="flat"
      />
      <HeroCard
        label="Sessões Ativas"
        value={String(data.sessions)}
        badge={{ label: data.apiStatus ? 'API OK' : 'API OFF', ok: data.apiStatus }}
        color="#06b6d4"
        bgColor="bg-cyan-500"
        borderColor="border-[#1E2030]"
        history={history}
        historyKey="sessions"
        trend="flat"
      />
    </div>
  );
}
