import React from 'react';
import { Server, RefreshCw, Monitor, LogOut, FolderOpen, Globe } from 'lucide-react';
import { clsx } from 'clsx';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { StatusIndicator } from './StatusIndicator';

interface TopCommandBarProps {
  status: 'online' | 'offline' | 'degraded';
  systemId: string;
  region: string;
  directory?: string;
  apiPort?: number;
  apiBaseUrl?: string;
  apiFound?: boolean;
  userEmail?: string;
  onSync: () => void;
  onOpsMode: () => void;
}

export function TopCommandBar({
  status, systemId, region, directory, apiPort, apiBaseUrl, apiFound, userEmail, onSync, onOpsMode,
}: TopCommandBarProps) {
  const isDown = status === 'offline';

  const handleLogout = async () => {
    try { await signOut(auth); } catch (e) { console.error(e); }
  };

  return (
    <div className={clsx(
      'border-b p-3 flex flex-col md:flex-row items-center justify-between gap-3 sticky top-0 z-50 shadow-md transition-colors',
      isDown ? 'bg-red-950/60 border-red-800/60' : 'bg-[#09090B] border-[#2A2B30]'
    )}>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className={clsx('p-1.5 rounded', isDown ? 'bg-red-500 text-white' : 'bg-white text-black')}>
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-none text-white">OPENCLAW</h1>
            <span className="text-[10px] font-mono text-[#8E9299] tracking-widest uppercase">Command Center</span>
          </div>
        </div>

        <div className="h-8 w-px bg-[#2A2B30] hidden md:block" />

        {isDown ? (
          <div className="flex items-center gap-2 bg-red-500/20 border border-red-500/50 px-3 py-1 rounded font-mono text-xs font-bold text-red-400 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            DOWN
          </div>
        ) : (
          <StatusIndicator status={status} label={status.toUpperCase()} className="bg-[#151619] px-3 py-1 rounded border border-[#2A2B30] text-xs font-bold" />
        )}

        <div className="hidden md:flex flex-col">
          <span className="text-[10px] text-[#8E9299] font-mono uppercase">Host</span>
          <span className="text-xs text-white font-mono">{systemId}</span>
        </div>

        <div className="hidden lg:flex flex-col">
          <span className="text-[10px] text-[#8E9299] font-mono uppercase">Device</span>
          <span className="text-xs text-white font-mono">{region}</span>
        </div>

        {directory && (
          <div className="hidden lg:flex items-center gap-1.5 bg-[#151619] px-2 py-1 rounded border border-[#2A2B30]">
            <FolderOpen className="w-3 h-3 text-[#8E9299]" />
            <span className="text-[10px] font-mono text-[#8E9299] max-w-[160px] truncate" title={directory}>{directory}</span>
          </div>
        )}

        <div className="hidden lg:flex items-center gap-1.5 bg-[#151619] px-2 py-1 rounded border border-[#2A2B30]">
          <Globe className="w-3 h-3 text-[#8E9299]" />
          {apiFound ? (
            <span className="text-[10px] font-mono text-green-400">API :{apiPort ?? '5000'}{apiBaseUrl ? ` · ${apiBaseUrl}` : ''}</span>
          ) : (
            <span className="text-[10px] font-mono text-red-400">API indisponível</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={onSync} className="p-2 text-[#8E9299] hover:text-white hover:bg-[#151619] rounded border border-transparent hover:border-[#2A2B30] transition-all" title="Sync">
          <RefreshCw className="w-4 h-4" />
        </button>
        <button onClick={onOpsMode} className="flex items-center gap-2 px-3 py-2 bg-[#151619] hover:bg-[#1E1F23] border border-[#2A2B30] rounded text-xs font-mono uppercase tracking-wider transition-colors text-white">
          <Monitor className="w-4 h-4" />
          <span className="hidden sm:inline">Ops Mode</span>
        </button>
        {userEmail && (
          <div className="flex items-center gap-2 bg-[#151619] border border-[#2A2B30] rounded px-2 py-1.5">
            <div className="w-5 h-5 rounded-full bg-[#2A2B30] flex items-center justify-center text-[10px] font-bold text-white uppercase">
              {userEmail[0]}
            </div>
            <span className="hidden sm:inline text-[10px] font-mono text-[#8E9299] max-w-[120px] truncate">{userEmail}</span>
            <button onClick={handleLogout} className="text-[#8E9299] hover:text-red-400 transition-colors ml-1" title="Sair">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
