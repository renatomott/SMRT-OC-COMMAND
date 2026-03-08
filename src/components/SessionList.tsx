import React, { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { SessionData } from '../types';
import { MessageCircle, Users, Bot, Globe, ChevronDown, ChevronUp } from 'lucide-react';

interface SessionListProps {
  sessions: SessionData;
  className?: string;
}

export function SessionList({ sessions, className }: SessionListProps) {
  const [expandedSection, setExpandedSection] = useState<'whatsapp' | 'discord' | null>(null);

  if (!sessions) return null;

  const whatsappContacts = sessions.whatsapp_contacts || sessions.details?.whatsapp || [];
  const discordChannels = sessions.discord_channels || sessions.details?.discord || [];
  const total = sessions.count || 0;
  const sizeMb = sessions.size_mb || 0;

  const toggle = (section: 'whatsapp' | 'discord') =>
    setExpandedSection(prev => prev === section ? null : section);

  return (
    <div className={twMerge('bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider">Active Sessions</h3>
        <span className="text-[#8E9299] text-xs font-mono">
          {total} sessões · {sizeMb} MB
        </span>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { icon: <MessageCircle className="w-4 h-4 text-green-500" />, label: 'WhatsApp', count: sessions.channels?.['whatsapp'] || 0, color: 'green' },
          { icon: <Users className="w-4 h-4 text-indigo-400" />, label: 'Discord', count: sessions.channels?.['discord'] || 0, color: 'indigo' },
          { icon: <Bot className="w-4 h-4 text-yellow-400" />, label: 'Subagents', count: sessions.channels?.['subagent'] || 0, color: 'yellow' },
          { icon: <Globe className="w-4 h-4 text-blue-400" />, label: 'Other', count: sessions.channels?.['other'] || 0, color: 'blue' },
        ].map(({ icon, label, count, color }) => (
          <div key={label} className="bg-[#1A1B1F] p-3 rounded border border-[#2A2B30] flex items-center gap-2">
            {icon}
            <div>
              <p className="text-[#8E9299] text-[10px] font-mono uppercase">{label}</p>
              <p className="text-white font-bold font-mono text-lg leading-none">{count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* WhatsApp detail */}
      {whatsappContacts.length > 0 && (
        <div className="mb-2">
          <button
            onClick={() => toggle('whatsapp')}
            className="w-full flex items-center justify-between text-[#8E9299] hover:text-white text-xs font-mono uppercase tracking-wider border-b border-[#2A2B30] pb-2 mb-2 transition-colors"
          >
            <span>WhatsApp Sessions ({whatsappContacts.length})</span>
            {expandedSection === 'whatsapp' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {expandedSection === 'whatsapp' && (
            <ul className="space-y-1 font-mono text-xs max-h-48 overflow-y-auto pr-1">
              {whatsappContacts.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-white bg-[#1A1B1F] px-3 py-1.5 rounded border border-[#2A2B30]/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                  <span className="truncate">{s}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Discord detail */}
      {discordChannels.length > 0 && (
        <div>
          <button
            onClick={() => toggle('discord')}
            className="w-full flex items-center justify-between text-[#8E9299] hover:text-white text-xs font-mono uppercase tracking-wider border-b border-[#2A2B30] pb-2 mb-2 transition-colors"
          >
            <span>Discord Sessions ({discordChannels.length})</span>
            {expandedSection === 'discord' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {expandedSection === 'discord' && (
            <ul className="space-y-1 font-mono text-xs max-h-48 overflow-y-auto pr-1">
              {discordChannels.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-white bg-[#1A1B1F] px-3 py-1.5 rounded border border-[#2A2B30]/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span className="truncate">{s}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {whatsappContacts.length === 0 && discordChannels.length === 0 && total === 0 && (
        <p className="text-[#8E9299] text-xs font-mono italic">Sem sessões no snapshot atual.</p>
      )}
    </div>
  );
}
