import React from 'react';
import { clsx } from 'clsx';
import { Server, Globe, FolderOpen, Clock, Cpu, Users, Zap } from 'lucide-react';

interface OpenClawStatusCardProps {
  data: any;
  className?: string;
}

function Row({ icon, label, value, valueClass }: { icon: React.ReactNode; label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#1A1B1F] last:border-0">
      <div className="flex items-center gap-2 text-[#8E9299]">
        {icon}
        <span className="text-[11px] font-mono uppercase tracking-wider">{label}</span>
      </div>
      <span className={clsx('text-xs font-mono font-bold truncate max-w-[140px]', valueClass || 'text-white')}>
        {value}
      </span>
    </div>
  );
}

export function OpenClawStatusCard({ data, className }: OpenClawStatusCardProps) {
  const status = data?.openclaw?.status || 'unknown';
  const isOnline = status === 'running' || status === 'online';
  const apiFound = data?.openclaw?.api?.found;
  const apiPort = data?.openclaw?.api?.port;
  const directory = data?.openclaw?.directory;
  const providers = data?.openclaw?.rich?.providers || {};
  const providerCount = Object.keys(providers).length;
  const sessions = data?.openclaw?.rich?.sessions?.count || 0;
  const uptimeHours = data?.system?.uptime?.uptime_hours;
  const cpuMw = (data?.system as any)?.power?.cpu_mw;
  const thermalPressure = (data?.system as any)?.power?.thermal_pressure;

  const formatUptime = (h: number) => {
    if (h < 1) return `${Math.round(h * 60)}m`;
    if (h < 24) return `${h.toFixed(1)}h`;
    return `${(h / 24).toFixed(1)}d`;
  };

  return (
    <div className={clsx('bg-[#0E0F11] border border-[#1E2030] rounded-xl p-4 shadow-sm', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={clsx('w-2 h-2 rounded-full', isOnline ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-red-500')} />
          <span className="text-xs font-mono uppercase tracking-widest text-white font-bold">OpenClaw</span>
        </div>
        <span className={clsx('text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold border', 
          isOnline ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10')}>
          {status}
        </span>
      </div>

      <div className="space-y-0">
        <Row icon={<Globe className="w-3 h-3" />} label="API"
          value={apiFound ? `:${apiPort || 5000}` : 'Indisponível'}
          valueClass={apiFound ? 'text-green-400' : 'text-red-400'} />
        <Row icon={<FolderOpen className="w-3 h-3" />} label="Diretório"
          value={directory ? directory.replace('/Users/mott/', '~/') : '—'} />
        <Row icon={<Server className="w-3 h-3" />} label="Providers"
          value={`${providerCount} configurados`} />
        <Row icon={<Users className="w-3 h-3" />} label="Sessões"
          value={`${sessions} ativas`} />
        {uptimeHours !== undefined && (
          <Row icon={<Clock className="w-3 h-3" />} label="Uptime"
            value={formatUptime(uptimeHours)} />
        )}
        {cpuMw !== undefined && (
          <Row icon={<Zap className="w-3 h-3" />} label="CPU Power"
            value={`${cpuMw} mW`}
            valueClass={cpuMw > 3000 ? 'text-red-400' : cpuMw > 1500 ? 'text-yellow-400' : 'text-green-400'} />
        )}
        {thermalPressure && (
          <Row icon={<Cpu className="w-3 h-3" />} label="Thermal"
            value={thermalPressure}
            valueClass={thermalPressure === 'Nominal' || thermalPressure === 'nominal' ? 'text-green-400' :
              thermalPressure === 'Fair' || thermalPressure === 'fair' ? 'text-yellow-400' : 'text-red-400'} />
        )}
      </div>
    </div>
  );
}
