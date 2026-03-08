import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface RichPresenceProps {
  providers: {
    [key: string]: any;
  };
  sessions: {
    [key: string]: any;
  };
  className?: string;
}

export function RichPresence({ providers, sessions, className }: RichPresenceProps) {
  return (
    <div className={twMerge("bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm", className)}>
      <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider mb-4">Rich Presence</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider mb-2">Providers</h4>
          <ul className="space-y-2">
            {Object.entries(providers).map(([key, value]) => (
              <li key={key} className="flex items-center justify-between text-xs font-mono text-white bg-[#1A1B1F] p-2 rounded border border-[#2A2B30]">
                <span className="text-[#8E9299]">{key}</span>
                <span className={clsx("px-2 py-0.5 rounded text-[10px] uppercase", {
                  "bg-green-500/10 text-green-500": value,
                  "bg-red-500/10 text-red-500": !value
                })}>
                  {value ? 'Active' : 'Inactive'}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider mb-2">Sessions</h4>
          <ul className="space-y-2">
            {Object.entries(sessions).map(([key, value]) => (
              <li key={key} className="flex items-center justify-between text-xs font-mono text-white bg-[#1A1B1F] p-2 rounded border border-[#2A2B30]">
                <span className="text-[#8E9299]">{key}</span>
                <span className="text-white font-bold">{value}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
