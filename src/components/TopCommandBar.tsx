import React from 'react';
import { Server, Activity, Shield, Zap, RefreshCw, Monitor, Play, Pause } from 'lucide-react';
import { clsx } from 'clsx';
import { StatusIndicator } from './StatusIndicator';

interface TopCommandBarProps {
  status: 'online' | 'offline' | 'degraded';
  systemId: string;
  region: string;
  simulating: boolean;
  onToggleSimulation: () => void;
  onSync: () => void;
  onOpsMode: () => void;
  simulationScenario: string;
  onScenarioChange: (scenario: string) => void;
}

export function TopCommandBar({
  status,
  systemId,
  region,
  simulating,
  onToggleSimulation,
  onSync,
  onOpsMode,
  simulationScenario,
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
        {/* Simulation Controls */}
        <div className="flex items-center bg-[#151619] rounded border border-[#2A2B30] p-1">
          <select 
            value={simulationScenario}
            onChange={(e) => onScenarioChange(e.target.value)}
            className="bg-transparent text-xs font-mono text-white border-none outline-none px-2 py-1 uppercase cursor-pointer hover:text-gray-300"
            disabled={!simulating}
          >
            <option value="normal">Normal Traffic</option>
            <option value="heavy_llm">Heavy LLM Load</option>
            <option value="memory_leak">Memory Leak</option>
            <option value="token_spike">Token Spike</option>
            <option value="provider_outage">Provider Outage</option>
          </select>
          <div className="w-px h-4 bg-[#2A2B30] mx-1" />
          <button 
            onClick={onToggleSimulation}
            className={clsx("p-1.5 rounded transition-colors", {
              "text-green-500 hover:bg-green-500/10": simulating,
              "text-[#8E9299] hover:text-white hover:bg-[#2A2B30]": !simulating
            })}
            title={simulating ? "Pause Simulation" : "Start Simulation"}
          >
            {simulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>

        <button 
          onClick={onSync}
          className="p-2 text-[#8E9299] hover:text-white hover:bg-[#151619] rounded border border-transparent hover:border-[#2A2B30] transition-all"
          title="Sync Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <button 
          onClick={onOpsMode}
          className="flex items-center gap-2 px-3 py-2 bg-[#151619] hover:bg-[#1E1F23] border border-[#2A2B30] rounded text-xs font-mono uppercase tracking-wider transition-colors text-white"
        >
          <Monitor className="w-4 h-4" />
          <span className="hidden sm:inline">Ops Mode</span>
        </button>
      </div>
    </div>
  );
}
