import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SessionData } from '../types';
import { MessageCircle, Users, Bot, Globe } from 'lucide-react';

interface SessionListProps {
  sessions: SessionData;
  className?: string;
}

export function SessionList({ sessions, className }: SessionListProps) {
  if (!sessions) return null;

  const whatsappContacts = sessions.whatsapp_contacts || sessions.details?.whatsapp || [];
  const discordChannels = sessions.discord_channels || sessions.details?.discord || [];

  return (
    <div className={twMerge("bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider">Active Sessions</h3>
        <span className="text-[#8E9299] text-xs font-mono">
          Total: {sessions.count || 0} ({sessions.size_mb || 0} MB)
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1A1B1F] p-3 rounded border border-[#2A2B30] flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-green-500" />
          <div>
            <p className="text-[#8E9299] text-[10px] font-mono uppercase">WhatsApp</p>
            <p className="text-white font-bold font-mono text-lg">{sessions.channels?.['whatsapp'] || 0}</p>
          </div>
        </div>
        <div className="bg-[#1A1B1F] p-3 rounded border border-[#2A2B30] flex items-center gap-3">
          <Users className="w-5 h-5 text-indigo-500" />
          <div>
            <p className="text-[#8E9299] text-[10px] font-mono uppercase">Discord</p>
            <p className="text-white font-bold font-mono text-lg">{sessions.channels?.['discord'] || 0}</p>
          </div>
        </div>
        <div className="bg-[#1A1B1F] p-3 rounded border border-[#2A2B30] flex items-center gap-3">
          <Bot className="w-5 h-5 text-yellow-500" />
          <div>
            <p className="text-[#8E9299] text-[10px] font-mono uppercase">Subagents</p>
            <p className="text-white font-bold font-mono text-lg">{sessions.channels?.['subagent'] || 0}</p>
          </div>
        </div>
        <div className="bg-[#1A1B1F] p-3 rounded border border-[#2A2B30] flex items-center gap-3">
          <Globe className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-[#8E9299] text-[10px] font-mono uppercase">Other</p>
            <p className="text-white font-bold font-mono text-lg">{sessions.channels?.['other'] || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider mb-3 border-b border-[#2A2B30] pb-2">
            WhatsApp Sessions
          </h4>
          <ul className="space-y-2 font-mono text-xs max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {whatsappContacts.length > 0 ? (
              whatsappContacts.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-white bg-[#1A1B1F] p-2 rounded border border-[#2A2B30]/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  {s}
                </li>
              ))
            ) : (
              <li className="text-[#8E9299] italic">No active sessions</li>
            )}
          </ul>
        </div>
        <div>
          <h4 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider mb-3 border-b border-[#2A2B30] pb-2">
            Discord Sessions
          </h4>
          <ul className="space-y-2 font-mono text-xs max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {discordChannels.length > 0 ? (
              discordChannels.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-white bg-[#1A1B1F] p-2 rounded border border-[#2A2B30]/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                  {s}
                </li>
              ))
            ) : (
              <li className="text-[#8E9299] italic">No active sessions</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
