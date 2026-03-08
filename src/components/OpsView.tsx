import React from 'react';
import { clsx } from 'clsx';
import { TelemetryData } from '../types';
import { Activity, AlertTriangle, CheckCircle, Server, Clock, HardDrive } from 'lucide-react';

interface OpsViewProps {
  data: TelemetryData | null;
  onExit: () => void;
}

export function OpsView({ data, onExit }: OpsViewProps) {
  if (!data) return null;

  const cpu  = data.system?.cpu?.usage_pct    ?? data.system?.cpu?.usage_percent    ?? data.system?.cpu?.usage    ?? 0;
  const mem  = data.system?.memory?.usage_pct  ?? data.system?.memory?.usage_percent  ?? data.system?.memory?.usage  ?? 0;
  const disk = data.system?.disk?.usage_pct    ?? data.system?.disk?.usage_percent    ?? data.system?.disk?.usage    ?? 0;
  const status = data.openclaw?.status || 'unknown';
  const isHealthy = (status === 'online' || status === 'running') && cpu < 90 && mem < 90 && disk < 90;

  const cronJobs = data.openclaw?.rich?.cron_jobs?.jobs || [];
  const failingCron = cronJobs.filter(j => (j.consecutive_errors || 0) > 0);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col p-8 font-mono text-white">
      <div className="flex justify-between items-center mb-12 border-b border-white/20 pb-4">
        <h1 className="text-4xl font-bold tracking-tighter text-white">OPS CENTER // MONITOR</h1>
        <button 
          onClick={onExit}
          className="px-6 py-2 border border-white/30 hover:bg-white hover:text-black transition-colors uppercase text-sm tracking-widest"
        >
          Exit Zen Mode
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Main Status */}
        <div className="flex flex-col justify-center items-center border border-white/10 bg-white/5 rounded-3xl p-12">
          <div className={clsx("w-64 h-64 rounded-full flex items-center justify-center mb-8 animate-pulse", {
            "bg-green-500/20 text-green-500 shadow-[0_0_100px_rgba(34,197,94,0.2)]": isHealthy,
            "bg-red-500/20 text-red-500 shadow-[0_0_100px_rgba(239,68,68,0.2)]": !isHealthy
          })}>
            {isHealthy ? (
              <CheckCircle className="w-32 h-32" />
            ) : (
              <AlertTriangle className="w-32 h-32" />
            )}
          </div>
          <h2 className="text-6xl font-bold mb-4">{isHealthy ? 'SYSTEM OPTIMAL' : 'ATTENTION REQUIRED'}</h2>
          <p className="text-xl text-white/50 tracking-widest uppercase">{status.toUpperCase()}</p>
        </div>

        {/* Critical Metrics Grid */}
        <div className="grid grid-cols-2 gap-6">
          <div className={clsx("p-8 rounded-2xl border flex flex-col justify-between", {
            "border-white/10 bg-white/5": cpu < 90,
            "border-red-500/50 bg-red-500/10": cpu >= 90
          })}>
            <div className="flex justify-between items-start">
              <Activity className="w-8 h-8 opacity-50" />
              <span className="text-4xl font-bold">{cpu.toFixed(0)}%</span>
            </div>
            <span className="text-sm uppercase tracking-widest opacity-50">CPU Load</span>
          </div>

          <div className={clsx("p-8 rounded-2xl border flex flex-col justify-between", {
            "border-white/10 bg-white/5": mem < 90,
            "border-red-500/50 bg-red-500/10": mem >= 90
          })}>
            <div className="flex justify-between items-start">
              <Server className="w-8 h-8 opacity-50" />
              <span className="text-4xl font-bold">{mem.toFixed(0)}%</span>
            </div>
            <span className="text-sm uppercase tracking-widest opacity-50">Memory</span>
          </div>

          <div className={clsx("p-8 rounded-2xl border flex flex-col justify-between", {
            "border-white/10 bg-white/5": disk < 90,
            "border-red-500/50 bg-red-500/10": disk >= 90
          })}>
            <div className="flex justify-between items-start">
              <HardDrive className="w-8 h-8 opacity-50" />
              <span className="text-4xl font-bold">{disk.toFixed(0)}%</span>
            </div>
            <span className="text-sm uppercase tracking-widest opacity-50">Disk Usage</span>
          </div>

          <div className={clsx("p-8 rounded-2xl border flex flex-col justify-between", {
            "border-white/10 bg-white/5": failingCron.length === 0,
            "border-yellow-500/50 bg-yellow-500/10": failingCron.length > 0
          })}>
            <div className="flex justify-between items-start">
              <Clock className="w-8 h-8 opacity-50" />
              <span className="text-4xl font-bold">{failingCron.length}</span>
            </div>
            <span className="text-sm uppercase tracking-widest opacity-50">Cron Errors</span>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center text-white/30 text-sm uppercase tracking-widest">
        OpenClaw Telemetry • {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
