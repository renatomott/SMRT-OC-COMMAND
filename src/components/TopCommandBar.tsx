import React from 'react';
import { Server, RefreshCw, Monitor } from 'lucide-react';
import { clsx } from 'clsx';
import { StatusIndicator } from './StatusIndicator';

interface TopCommandBarProps {
  status: 'online' | 'offline' | 'degraded';
  systemId: string;
  region: string;
  onSync: () => void;
  onOpsMode: () => void;
}

export function TopCommandBar({
  status,
  systemId,
  region,
  onSync,
  onOpsMode,
  onScenarioChange
}: TopCommandBarProps) {
  return (
    <div className="bg-[#09090B] border-b border-[#2A2B30] p-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-50 shadow-md">
      {/* Left: Identity & Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-white text-black p-1.5 rounded">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-none text-white">OPENCLAW</h1>
            <span className="text-[10px] font-mono text-[#8E9299] tracking-widest uppercase">Command Center</span>
          </div>
        </div>
        
        <div className="h-8 w-px bg-[#2A2B30] mx-2 hidden md:block" />
        
        <StatusIndicator 
          status={status} 
          label={status.toUpperCase()} 
          className="bg-[#151619] px-3 py-1 rounded border border-[#2A2B30] text-xs font-bold"
        />
        
        <div className="hidden md:flex flex-col">
          <span className="text-[10px] text-[#8E9299] font-mono uppercase">System ID</span>
          <span className="text-xs text-white font-mono">{systemId}</span>
        </div>
        
        <div className="hidden md:flex flex-col">
          <span className="text-[10px] text-[#8E9299] font-mono uppercase">Region</span>
          <span className="text-xs text-white font-mono">{region}</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        </div>
  );
}
