import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Clock, CheckCircle, XCircle, AlertCircle, Timer } from 'lucide-react';
import { CronJob } from '../types';

interface CronHealthPanelProps {
  jobs: CronJob[];
  className?: string;
}

function useCountdown(nextRunAt?: string) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    if (!nextRunAt) return;
    const update = () => {
      const diff = new Date(nextRunAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining('Agora'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [nextRunAt]);
  return remaining;
}

function NextJobCard({ job }: { job: CronJob }) {
  const countdown = useCountdown(job.next_run_at);
  const hasError = (job.consecutive_errors ?? 0) > 0;
  return (
    <div className={clsx('rounded-lg border p-3', hasError ? 'bg-red-500/5 border-red-500/20' : 'bg-[#151619] border-[#1E2030]')}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Timer className={clsx('w-3 h-3', hasError ? 'text-red-400' : 'text-cyan-400')} />
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#8E9299]">Próximo job</span>
        </div>
        <span className={clsx('text-lg font-black font-mono', hasError ? 'text-red-400' : 'text-cyan-400')}>{countdown}</span>
      </div>
      <div className="text-xs font-mono text-white font-bold truncate">{job.name}</div>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[9px] font-mono text-[#8E9299]">{job.schedule}</span>
        {job.model && <span className="text-[9px] font-mono text-purple-400">· {job.model}</span>}
        {job.delivery_channel && <span className="text-[9px] font-mono text-blue-400">· {job.delivery_channel}</span>}
      </div>
    </div>
  );
}

export function CronHealthPanel({ jobs, className }: CronHealthPanelProps) {
  const enabled  = jobs.filter(j => j.enabled !== false);
  const failing  = jobs.filter(j => (j.consecutive_errors ?? 0) > 0);
  const ok       = enabled.filter(j => (j.consecutive_errors ?? 0) === 0 && j.last_run_status && (j.last_run_status === 'success' || j.last_run_status === 'ok'));
  const pending  = enabled.filter(j => !j.last_run_status);
  const successRate = enabled.length > 0 ? ((ok.length / enabled.length) * 100) : 100;

  // Next job
  const nextJob = [...enabled]
    .filter(j => j.next_run_at)
    .sort((a, b) => new Date(a.next_run_at!).getTime() - new Date(b.next_run_at!).getTime())[0];

  return (
    <div className={clsx('bg-[#0E0F11] border border-[#1E2030] rounded-xl p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#8E9299]" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E9299]">Cron Jobs</span>
        </div>
        <span className={clsx('text-sm font-black font-mono', successRate >= 90 ? 'text-green-400' : successRate >= 70 ? 'text-yellow-400' : 'text-red-400')}>
          {successRate.toFixed(0)}% ok
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Total',     value: jobs.length,     color: 'text-white' },
          { label: 'OK',        value: ok.length,       color: 'text-green-400' },
          { label: 'Falhas',    value: failing.length,  color: failing.length > 0 ? 'text-red-400' : 'text-[#8E9299]' },
          { label: 'Pendente',  value: pending.length,  color: 'text-[#8E9299]' },
        ].map(s => (
          <div key={s.label} className="bg-[#151619] border border-[#1A1B1F] rounded-lg p-2 text-center">
            <div className={clsx('text-lg font-black font-mono', s.color)}>{s.value}</div>
            <div className="text-[8px] font-mono uppercase text-[#8E9299]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Success rate bar */}
      <div className="mb-4">
        <div className="h-1.5 bg-[#1A1B1F] rounded-full overflow-hidden">
          <div
            className={clsx('h-full rounded-full transition-all duration-700', successRate >= 90 ? 'bg-green-500' : successRate >= 70 ? 'bg-yellow-500' : 'bg-red-500')}
            style={{ width: `${successRate}%` }}
          />
        </div>
      </div>

      {/* Next job countdown */}
      {nextJob && <NextJobCard job={nextJob} />}

      {/* Failing jobs */}
      {failing.length > 0 && (
        <div className="mt-3 space-y-1.5">
          <div className="text-[9px] font-mono uppercase text-red-400 font-bold tracking-wider">Falhando</div>
          {failing.map(j => (
            <div key={j.id || j.name} className="flex items-center justify-between bg-red-500/5 border border-red-500/15 rounded-lg px-3 py-2">
              <span className="text-xs font-mono text-white truncate">{j.name}</span>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <XCircle className="w-3 h-3 text-red-400" />
                <span className="text-[10px] font-mono text-red-400 font-bold">{j.consecutive_errors}x</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
