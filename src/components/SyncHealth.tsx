import React, { useState, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
import { Activity, Clock, Database, Wifi, WifiOff } from 'lucide-react';

interface SyncHealthProps {
  lastUpdated?: string;
  deviceId?: string;
  className?: string;
}

export function SyncHealth({ lastUpdated, deviceId, className }: SyncHealthProps) {
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);

  useEffect(() => {
    if (!lastUpdated) return;

    const update = () => {
      const last = new Date(lastUpdated).getTime();
      const diff = Math.floor((Date.now() - last) / 1000);
      setSecondsAgo(diff);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const formatAge = (s: number) => {
    if (s < 60) return `${s}s atrás`;
    if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s atrás`;
    return `${Math.floor(s / 3600)}h atrás`;
  };

  const isStale = secondsAgo !== null && secondsAgo > 120;
  const isFresh = secondsAgo !== null && secondsAgo <= 120;
  const listenerStatus = secondsAgo === null ? 'aguardando' : isFresh ? 'conectado' : 'atrasado';

  return (
    <div className={twMerge('bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-[#8E9299]" />
        <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider">Saúde da Sincronização</h3>
      </div>

      <div className="space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between bg-[#1A1B1F] p-2.5 rounded border border-[#2A2B30]">
          <div className="flex items-center gap-2 text-[#8E9299]">
            <Database className="w-3.5 h-3.5" />
            <span>Coleção</span>
          </div>
          <span className="text-white">openclaw_telemetry</span>
        </div>

        <div className="flex items-center justify-between bg-[#1A1B1F] p-2.5 rounded border border-[#2A2B30]">
          <div className="flex items-center gap-2 text-[#8E9299]">
            <Database className="w-3.5 h-3.5" />
            <span>Último documento</span>
          </div>
          <span className="text-white truncate max-w-[180px]">{deviceId || '—'}</span>
        </div>

        <div className="flex items-center justify-between bg-[#1A1B1F] p-2.5 rounded border border-[#2A2B30]">
          <div className="flex items-center gap-2 text-[#8E9299]">
            <Clock className="w-3.5 h-3.5" />
            <span>Última atualização</span>
          </div>
          <span className={clsx('font-bold', {
            'text-green-400': isFresh,
            'text-yellow-400': isStale,
            'text-[#8E9299]': secondsAgo === null,
          })}>
            {secondsAgo !== null ? formatAge(secondsAgo) : '—'}
          </span>
        </div>

        <div className="flex items-center justify-between bg-[#1A1B1F] p-2.5 rounded border border-[#2A2B30]">
          <div className="flex items-center gap-2 text-[#8E9299]">
            {listenerStatus === 'conectado' ? (
              <Wifi className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-yellow-400" />
            )}
            <span>Listener status</span>
          </div>
          <span className={clsx('uppercase text-[10px] px-2 py-0.5 rounded font-bold', {
            'bg-green-500/10 text-green-400': listenerStatus === 'conectado',
            'bg-yellow-500/10 text-yellow-400': listenerStatus === 'atrasado',
            'bg-[#2A2B30] text-[#8E9299]': listenerStatus === 'aguardando',
          })}>
            {listenerStatus}
          </span>
        </div>
      </div>
    </div>
  );
}
