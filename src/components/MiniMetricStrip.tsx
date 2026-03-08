import React from 'react';
import { Cpu, HardDrive, Activity, Brain, AlertTriangle, AlertCircle, Users, Wifi, Server } from 'lucide-react';
import { clsx } from 'clsx';

interface MiniMetricStripProps {
  cpu: number;
  memory: number;
  disk: number;
  totalTokens: number;
  activeSessions: number;
  warnings: number;
  errors: number;
  // novas props
  cpuAvg?: number;
  memAvg?: number;
  activeProviders?: number;
  totalProviders?: number;
  networkSentMb?: number;
  networkRecvMb?: number;
}

export function MiniMetricStrip({
  cpu, memory, disk, totalTokens, activeSessions, warnings, errors,
  cpuAvg, memAvg, activeProviders, totalProviders, networkSentMb, networkRecvMb
}: MiniMetricStripProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2 p-4 bg-[#09090B] border-b border-[#2A2B30]">
      <MetricItem
        icon={<Cpu className="w-4 h-4" />}
        label="CPU"
        value={`${cpu.toFixed(1)}%`}
        sub={cpuAvg !== undefined ? `avg ${cpuAvg.toFixed(1)}%` : undefined}
        status={cpu > 80 ? 'critical' : cpu > 60 ? 'warning' : 'normal'}
      />
      <MetricItem
        icon={<Activity className="w-4 h-4" />}
        label="MEM"
        value={`${memory.toFixed(1)}%`}
        sub={memAvg !== undefined ? `avg ${memAvg.toFixed(1)}%` : undefined}
        status={memory > 85 ? 'critical' : memory > 70 ? 'warning' : 'normal'}
      />
      <MetricItem
        icon={<HardDrive className="w-4 h-4" />}
        label="DISK"
        value={`${disk.toFixed(1)}%`}
        status={disk > 90 ? 'critical' : disk > 75 ? 'warning' : 'normal'}
      />
      <MetricItem
        icon={<Brain className="w-4 h-4" />}
        label="TOKENS"
        value={totalTokens > 1e6 ? `${(totalTokens/1e6).toFixed(1)}M` : totalTokens.toLocaleString()}
        status={totalTokens > 1000000 ? 'warning' : 'normal'}
      />
      <MetricItem
        icon={<Users className="w-4 h-4" />}
        label="SESSIONS"
        value={activeSessions.toString()}
        status="normal"
      />
      <MetricItem
        icon={<Server className="w-4 h-4" />}
        label="PROVIDERS"
        value={totalProviders !== undefined ? `${activeProviders ?? 0}/${totalProviders}` : (activeProviders ?? 0).toString()}
        status={totalProviders !== undefined && (activeProviders ?? 0) < totalProviders ? 'warning' : 'normal'}
      />
      <MetricItem
        icon={<Wifi className="w-4 h-4" />}
        label="NET ↑"
        value={networkSentMb !== undefined ? `${networkSentMb.toFixed(0)}MB` : '—'}
        status="normal"
      />
      <MetricItem
        icon={<Wifi className="w-4 h-4" />}
        label="NET ↓"
        value={networkRecvMb !== undefined ? `${networkRecvMb.toFixed(0)}MB` : '—'}
        status="normal"
      />
      <MetricItem
        icon={<AlertTriangle className="w-4 h-4" />}
        label="WARN"
        value={warnings.toString()}
        status={warnings > 0 ? 'warning' : 'normal'}
      />
      <MetricItem
        icon={<AlertCircle className="w-4 h-4" />}
        label="ERRORS"
        value={errors.toString()}
        status={errors > 0 ? 'critical' : 'normal'}
      />
    </div>
  );
}

interface MetricItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  status: 'normal' | 'warning' | 'critical';
}

function MetricItem({ icon, label, value, sub, status }: MetricItemProps) {
  return (
    <div className={clsx("flex items-center gap-2 p-2 rounded border transition-colors", {
      "bg-[#151619] border-[#2A2B30]": status === 'normal',
      "bg-yellow-500/10 border-yellow-500/20 text-yellow-500": status === 'warning',
      "bg-red-500/10 border-red-500/20 text-red-500": status === 'critical'
    })}>
      <div className={clsx("p-1.5 rounded shrink-0", {
        "bg-[#2A2B30] text-[#8E9299]": status === 'normal',
        "bg-yellow-500/20 text-yellow-500": status === 'warning',
        "bg-red-500/20 text-red-500": status === 'critical'
      })}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#8E9299] leading-none mb-0.5">{label}</div>
        <div className={clsx("text-sm font-mono font-bold leading-none", {
          "text-white": status === 'normal',
          "text-yellow-500": status === 'warning',
          "text-red-500": status === 'critical'
        })}>{value}</div>
        {sub && <div className="text-[9px] font-mono text-[#8E9299] leading-none mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}
