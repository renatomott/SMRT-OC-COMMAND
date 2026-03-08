import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SystemMetrics } from '../types';
import { Cpu, HardDrive, Activity, Clock, Network, Thermometer, Zap } from 'lucide-react';

interface SystemDetailsProps {
  system: SystemMetrics;
  className?: string;
}

export function SystemDetails({ system, className }: SystemDetailsProps) {
  return (
    <div className={twMerge("grid grid-cols-1 md:grid-cols-2 gap-6", className)}>
      {/* CPU Section */}
      <div className="bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-4 h-4 text-[#8E9299]" />
          <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider">CPU Details</h3>
        </div>
        <div className="space-y-2 font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-[#8E9299]">Physical Cores</span>
            <span className="text-white">{system.cpu?.physical_cores || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8E9299]">Logical Cores</span>
            <span className="text-white">{system.cpu?.logical_cores || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8E9299]">Frequência</span>
            <span className="text-white">
              {system.cpu?.freq_mhz_current
                ? system.cpu.freq_mhz_current >= 1000
                  ? `${(system.cpu.freq_mhz_current / 1000).toFixed(2)} GHz`
                  : `${system.cpu.freq_mhz_current} MHz`
                : '-'}
            </span>
          </div>
          {system.temperature?.cpu_celsius && parseFloat(system.temperature.cpu_celsius) > 0 && (
            <div className="flex justify-between">
              <span className="text-[#8E9299]">Temperatura CPU</span>
              <span className={
                parseFloat(system.temperature.cpu_celsius) > 85 ? 'text-red-400' :
                parseFloat(system.temperature.cpu_celsius) > 70 ? 'text-yellow-400' : 'text-green-400'
              }>
                {system.temperature.cpu_celsius}°C
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[#8E9299]">Load (1m/5m/15m)</span>
            <span className="text-white">
              {system.load_avg ? `${system.load_avg['1min']} / ${system.load_avg['5min']} / ${system.load_avg['15min']}` : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Memory Section */}
      <div className="bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-[#8E9299]" />
          <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider">Memory Details</h3>
        </div>
        <div className="space-y-2 font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-[#8E9299]">Used / Total</span>
            <span className="text-white">
              {system.memory?.used_gb?.toFixed(1) || '-'} GB / {system.memory?.total_gb?.toFixed(1) || '-'} GB
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8E9299]">Available</span>
            <span className="text-white">{system.memory?.available_gb?.toFixed(1) || '-'} GB</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8E9299]">Swap Usage</span>
            <span className="text-white">
              {system.memory?.swap_pct || 0}% ({system.memory?.swap_used_gb?.toFixed(1) || 0} GB)
            </span>
          </div>
        </div>
      </div>

      {/* Disk Section */}
      <div className="bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <HardDrive className="w-4 h-4 text-[#8E9299]" />
          <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider">Disk Details</h3>
        </div>
        <div className="space-y-2 font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-[#8E9299]">Used / Total</span>
            <span className="text-white">
              {system.disk?.used_gb?.toFixed(1) || '-'} GB / {system.disk?.total_gb?.toFixed(1) || '-'} GB
            </span>
          </div>
          {system.disk?.io && (
            <div className="flex justify-between">
              <span className="text-[#8E9299]">I/O (Read/Write)</span>
              <span className="text-white">
                {system.disk.io.read_mb} MB / {system.disk.io.write_mb} MB
              </span>
            </div>
          )}
          {system.disk?.partitions && (
            <div className="mt-4 pt-4 border-t border-[#2A2B30]">
              <h4 className="text-[#8E9299] mb-2">Partitions</h4>
              {system.disk.partitions.map((p, i) => (
                <div key={i} className="flex justify-between mb-1">
                  <span className="text-[#8E9299]">{p.mountpoint}</span>
                  <span className="text-white">{p.usage_pct}% ({p.used_gb?.toFixed(1)}GB)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Network & Uptime Section */}
      <div className="bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Network className="w-4 h-4 text-[#8E9299]" />
          <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider">Network & Uptime</h3>
        </div>
        <div className="space-y-2 font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-[#8E9299]">Uptime</span>
            <span className="text-white">
              {system.uptime?.uptime_hours ? `${system.uptime.uptime_hours}h` : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8E9299]">Boot Time</span>
            <span className="text-white">{system.uptime?.boot_time || '-'}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-[#2A2B30]">
            <h4 className="text-[#8E9299] mb-2">Traffic</h4>
            <div className="flex justify-between">
              <span className="text-[#8E9299]">Sent</span>
              <span className="text-white">{system.network?.bytes_sent_mb || 0} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8E9299]">Received</span>
              <span className="text-white">{system.network?.bytes_recv_mb || 0} MB</span>
            </div>
          </div>
        </div>
      </div>
      {/* Power Section — Apple Silicon */}
      {(system as any).power?.cpu_mw !== undefined && (
        <div className="bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#8E9299]" />
              <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider">Apple Silicon Power</h3>
            </div>
            <span className={clsx('text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold', {
              'bg-green-500/10 text-green-400': (system as any).power?.thermal_pressure === 'Nominal' || (system as any).power?.thermal_pressure === 'nominal',
              'bg-yellow-500/10 text-yellow-400': (system as any).power?.thermal_pressure === 'Fair' || (system as any).power?.thermal_pressure === 'fair',
              'bg-orange-500/10 text-orange-400': (system as any).power?.thermal_pressure === 'Serious' || (system as any).power?.thermal_pressure === 'serious',
              'bg-red-500/10 text-red-400': (system as any).power?.thermal_pressure === 'Critical' || (system as any).power?.thermal_pressure === 'critical',
            })}>
              {(system as any).power?.thermal_pressure || 'unknown'}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
            {[
              { label: 'CPU Power', value: (system as any).power?.cpu_mw, color: 'text-blue-400' },
              { label: 'GPU Power', value: (system as any).power?.gpu_mw, color: 'text-purple-400' },
              { label: 'ANE Power', value: (system as any).power?.ane_mw, color: 'text-yellow-400' },
              { label: 'Combined', value: (system as any).power?.combined_mw, color: 'text-white' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-[#1A1B1F] p-3 rounded border border-[#2A2B30]">
                <div className="text-[#8E9299] text-[10px] uppercase tracking-wider mb-1">{label}</div>
                <div className={clsx('text-lg font-bold', color)}>
                  {value !== null && value !== undefined ? `${value} mW` : '—'}
                </div>
                {value !== null && value !== undefined && (
                  <div className="text-[#8E9299] text-[9px] mt-0.5">{(value / 1000).toFixed(2)} W</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
