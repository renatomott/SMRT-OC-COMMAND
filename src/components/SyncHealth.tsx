import React, { useState, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
import { Activity, Clock, Database, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface SyncHealthProps {
  lastUpdated?: any; // pode ser string ISO, Firestore Timestamp, ou Date
  deviceId?: string;
  className?: string;
}

function parseTimestamp(val: any): Date | null {
  if (!val) return null;
  // Firestore Timestamp object
  if (val?.toDate && typeof val.toDate === 'function') return val.toDate();
  // Firestore Timestamp with seconds
  if (val?.seconds) return new Date(val.seconds * 1000);
  // ISO string or anything Date() accepts
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export function SyncHealth({ lastUpdated, deviceId, className }: SyncHealthProps) {
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);
  const [lastDate, setLastDate] = useState<Date | null>(null);

  useEffect(() => {
    const parsed = parseTimestamp(lastUpdated);
    setLastDate(parsed);
    if (!parsed) { setSecondsAgo(null); return; }

    const update = () => setSecondsAgo(Math.floor((Date.now() - parsed.getTime()) / 1000));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [lastUpdated]);

  const formatAge = (s: number) => {
    if (s < 60) return `${s}s atrás`;
    if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s atrás`;
    return `${Math.floor(s / 3600)}h atrás`;
  };

  const isFresh  = secondsAgo !== null && secondsAgo <= 90;
  const isStale  = secondsAgo !== null && secondsAgo > 90 && secondsAgo <= 300;
  const isLate   = secondsAgo !== null && secondsAgo > 300;
  const status   = secondsAgo === null ? 'aguardando' : isFresh ? 'conectado' : isStale ? 'atrasado' : 'offline';

  const statusColors = {
    conectado:  { badge: 'bg-green-500/10 text-green-400 border-green-500/20',  dot: 'bg-green-500',  icon: Wifi },
    atrasado:   { badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', dot: 'bg-yellow-500 animate-pulse', icon: WifiOff },
    offline:    { badge: 'bg-red-500/10 text-red-400 border-red-500/20',        dot: 'bg-red-500 animate-pulse',    icon: WifiOff },
    aguardando: { badge: 'bg-[#2A2B30] text-[#8E9299] border-[#2A2B30]',       dot: 'bg-[#8E9299]',                icon: RefreshCw },
  };
  const cfg = statusColors[status];
  const StatusIcon = cfg.icon;

  return (
    <div className={twMerge('bg-[#0E0F11] border border-[#1E2030] rounded-xl p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#8E9299]" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E9299]">Sincronização</span>
        </div>
        <div className={clsx('flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase', cfg.badge)}>
          <div className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
          {status}
        </div>
      </div>

      <div className="space-y-2 font-mono text-[11px]">
        <div className="flex items-center justify-between py-2 border-b border-[#1A1B1F]">
          <div className="flex items-center gap-2 text-[#8E9299]">
            <Database className="w-3 h-3" />
            <span>Coleção</span>
          </div>
          <span className="text-white font-bold">openclaw_telemetry</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-[#1A1B1F]">
          <div className="flex items-center gap-2 text-[#8E9299]">
            <Database className="w-3 h-3" />
            <span>Dispositivo</span>
          </div>
          <span className="text-white truncate max-w-[160px]" title={deviceId}>{deviceId || '—'}</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-[#1A1B1F]">
          <div className="flex items-center gap-2 text-[#8E9299]">
            <Clock className="w-3 h-3" />
            <span>Última sync</span>
          </div>
          <span className={clsx('font-bold', {
            'text-green-400': isFresh,
            'text-yellow-400': isStale,
            'text-red-400': isLate,
            'text-[#8E9299]': secondsAgo === null,
          })}>
            {secondsAgo !== null ? formatAge(secondsAgo) : '—'}
          </span>
        </div>

        {lastDate && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2 text-[#8E9299]">
              <Clock className="w-3 h-3" />
              <span>Horário</span>
            </div>
            <span className="text-[#8E9299]">
              {lastDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        )}
      </div>

      {/* Progress bar showing time since last sync vs 90s threshold */}
      {secondsAgo !== null && (
        <div className="mt-3 pt-3 border-t border-[#1A1B1F]">
          <div className="flex justify-between text-[9px] font-mono text-[#8E9299] mb-1">
            <span>Tempo desde último sync</span>
            <span>{secondsAgo}s / 90s limite</span>
          </div>
          <div className="h-1 bg-[#1A1B1F] rounded-full overflow-hidden">
            <div
              className={clsx('h-full rounded-full transition-all duration-1000', {
                'bg-green-500':  isFresh,
                'bg-yellow-500': isStale,
                'bg-red-500':    isLate,
              })}
              style={{ width: `${Math.min((secondsAgo / 90) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
