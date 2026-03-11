import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { db } from '../services/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { RotateCcw, Square, RefreshCw, Terminal, CheckCircle, XCircle, Loader, Clock, AlertTriangle } from 'lucide-react';

interface RemoteCommandPanelProps {
  deviceId: string;
  className?: string;
}

interface CommandLog {
  id: string;
  command: string;
  status: 'pending' | 'running' | 'done' | 'error';
  issued_at: string;
  started_at?: string;
  completed_at?: string;
  result?: { success: boolean; message: string; command?: string };
}

const COMMANDS = [
  {
    id:    'gateway_restart',
    label: 'Restart Gateway',
    icon:  RotateCcw,
    color: 'text-amber-400',
    bg:    'bg-amber-500/10 border-amber-500/25 hover:bg-amber-500/20',
    confirm: 'Reiniciar o gateway vai interromper todas as sessões ativas por alguns segundos. Confirmar?',
  },
  {
    id:    'gateway_stop',
    label: 'Stop Gateway',
    icon:  Square,
    color: 'text-red-400',
    bg:    'bg-red-500/10 border-red-500/25 hover:bg-red-500/20',
    confirm: 'Parar o gateway encerrará todas as sessões. Confirmar?',
  },
  {
    id:      'sync_now',
    label:   'Force Sync',
    icon:    RefreshCw,
    color:   'text-blue-400',
    bg:      'bg-blue-500/10 border-blue-500/25 hover:bg-blue-500/20',
    confirm: null,
    cooldown: 15,
  },
];

function statusIcon(status: CommandLog['status']) {
  if (status === 'pending') return <Clock className="w-3.5 h-3.5 text-[#8E9299] animate-pulse" />;
  if (status === 'running') return <Loader className="w-3.5 h-3.5 text-blue-400 animate-spin" />;
  if (status === 'done')    return <CheckCircle className="w-3.5 h-3.5 text-green-400" />;
  return                           <XCircle className="w-3.5 h-3.5 text-red-400" />;
}

function elapsed(from?: string, to?: string): string {
  if (!from) return '';
  const ms = (to ? new Date(to) : new Date()).getTime() - new Date(from).getTime();
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export function RemoteCommandPanel({ deviceId, className }: RemoteCommandPanelProps) {
  const [sending, setSending] = useState<string | null>(null);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});

  // Cooldown countdown ticker
  useEffect(() => {
    const id = setInterval(() => {
      setCooldowns(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(k => {
          if (next[k] > 0) { next[k]--; changed = true; }
          else delete next[k];
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);
  const [logs, setLogs] = useState<CommandLog[]>([]);
  const [confirm, setConfirm] = useState<typeof COMMANDS[0] | null>(null);

  // Listen to recent commands for this device
  useEffect(() => {
    if (!deviceId || deviceId.trim() === '') return;
    try {
    const ref = collection(db, 'commands', deviceId, 'pending');
    const q = query(ref, orderBy('issued_at', 'desc'), limit(8));
    const unsub = onSnapshot(q, snap => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as CommandLog)));
    });
    return () => unsub();
    } catch (e) {
      console.error('RemoteCommandPanel listener error:', e);
    }
  }, [deviceId]);

  const issueCommand = async (cmd: typeof COMMANDS[0]) => {
    if (cmd.confirm && !window.confirm(cmd.confirm)) return;
    setSending(cmd.id);
    try {
      await addDoc(collection(db, 'commands', deviceId, 'pending'), {
        command:   cmd.id,
        status:    'pending',
        issued_at: new Date().toISOString(),
        issued_by: 'dashboard',
      });
      if ((cmd as any).cooldown) {
        setCooldowns(prev => ({ ...prev, [cmd.id]: (cmd as any).cooldown }));
      }
    } catch (e) {
      console.error('Command failed:', e);
    } finally {
      setSending(null);
    }
  };

  return (
    <div className={clsx('bg-[#0E0F11] border border-[#1E2030] rounded-xl p-4', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Terminal className="w-4 h-4 text-[#8E9299]" />
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E9299]">Controle Remoto</span>
        <span className="ml-auto text-[9px] font-mono text-[#8E9299]">executa no próximo sync (~60s)</span>
      </div>

      {/* Command buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {COMMANDS.map(cmd => {
          const Icon = cmd.icon;
          const isLoading = sending === cmd.id;
          const lastRun = logs.find(l => l.command === cmd.id);
          const isPending = lastRun?.status === 'pending' || lastRun?.status === 'running';
          return (
            <button
              key={cmd.id}
              onClick={() => issueCommand(cmd)}
              disabled={!!sending || isPending}
              className={clsx(
                'flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg border transition-all text-center',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                cmd.bg
              )}
            >
              {isLoading || isPending
                ? <Loader className={clsx('w-4 h-4 animate-spin', cmd.color)} />
                : <Icon className={clsx('w-4 h-4', cmd.color)} />
              }
              <span className={clsx('text-[10px] font-mono font-bold leading-tight', cmd.color)}>
                {cooldownLeft > 0 ? `${cooldownLeft}s` : cmd.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Command log */}
      {logs.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[9px] font-mono uppercase tracking-wider text-[#8E9299] mb-2">Histórico</div>
          {logs.slice(0, 5).map(log => (
            <div key={log.id} className={clsx(
              'flex items-start gap-2 px-3 py-2 rounded-lg border text-[10px] font-mono',
              log.status === 'done'    ? 'bg-green-500/5 border-green-500/15' :
              log.status === 'error'   ? 'bg-red-500/5 border-red-500/15' :
              log.status === 'running' ? 'bg-blue-500/5 border-blue-500/15' :
                                         'bg-[#151619] border-[#1A1B1F]'
            )}>
              <div className="mt-0.5 shrink-0">{statusIcon(log.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-bold text-white">{log.command}</span>
                  <span className="text-[#8E9299] shrink-0 tabular-nums">
                    {log.status === 'running'
                      ? `${elapsed(log.started_at)}…`
                      : log.completed_at ? elapsed(log.issued_at, log.completed_at) : ''}
                  </span>
                </div>
                {log.result?.message && (
                  <div className={clsx('mt-0.5 truncate', log.result.success ? 'text-green-400' : 'text-red-400')}>
                    {log.result.message}
                  </div>
                )}
                <div className="text-[#8E9299] mt-0.5">
                  {new Date(log.issued_at).toLocaleTimeString('pt-BR')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warning */}
      <div className="flex items-start gap-2 mt-4 pt-3 border-t border-[#1A1B1F]">
        <AlertTriangle className="w-3 h-3 text-[#8E9299] mt-0.5 shrink-0" />
        <p className="text-[9px] font-mono text-[#8E9299] leading-relaxed">
          Comandos são executados no próximo ciclo de sync do Mac mini (~60s). O status atualiza em tempo real.
        </p>
      </div>
    </div>
  );
}
