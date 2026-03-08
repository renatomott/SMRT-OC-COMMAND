import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { OpenClawData } from '../types';
import { Key, Box, Terminal } from 'lucide-react';

interface IntegrationListProps {
  data: OpenClawData;
  className?: string;
}

export function IntegrationList({ data, className }: IntegrationListProps) {
  return (
    <div className={twMerge("grid grid-cols-1 md:grid-cols-2 gap-6", className)}>
      {/* Environment Keys */}
      <div className="bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-4 h-4 text-[#8E9299]" />
          <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider">Configured Integrations</h3>
        </div>
        <ul className="space-y-2 font-mono text-xs max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {data.integrations?.env_keys?.length ? (
            data.integrations.env_keys.map((key, i) => (
              <li key={i} className="flex items-center justify-between text-white bg-[#1A1B1F] p-2 rounded border border-[#2A2B30]/50">
                <span className="truncate max-w-[200px]">{key}</span>
                <span className="text-green-500 text-[10px] uppercase bg-green-500/10 px-1.5 py-0.5 rounded">Configured</span>
              </li>
            ))
          ) : (
            <li className="text-[#8E9299] italic">No integrations found</li>
          )}
        </ul>
      </div>

      {/* Ollama Models */}
      <div className="bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Box className="w-4 h-4 text-[#8E9299]" />
          <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider">Ollama Models</h3>
        </div>
        <ul className="space-y-2 font-mono text-xs max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {data.ollama?.models?.length ? (
            data.ollama.models.map((model, i) => (
              <li key={i} className="flex items-center gap-2 text-white bg-[#1A1B1F] p-2 rounded border border-[#2A2B30]/50">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                {model}
              </li>
            ))
          ) : (
            <li className="text-[#8E9299] italic">No models loaded</li>
          )}
        </ul>
      </div>

      {/* Cron Jobs */}
      <div className="bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm md:col-span-2">
        <div className="flex items-center gap-2 mb-4">
          <Terminal className="w-4 h-4 text-[#8E9299]" />
          <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider">
            Cron Jobs ({data.cron?.count || 0})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[#2A2B30] text-[#8E9299]">
                <th className="pb-2 font-normal w-24">SCHEDULE</th>
                <th className="pb-2 font-normal">COMMAND</th>
                <th className="pb-2 font-normal text-right">LAST RUN</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {data.cron?.jobs?.length ? (
                data.cron.jobs.map((job, i) => (
                  <tr key={i} className="border-b border-[#2A2B30] last:border-0 hover:bg-[#1E1F23] transition-colors">
                    <td className="py-2 text-yellow-500 font-bold">{job.schedule}</td>
                    <td className="py-2 text-[#8E9299]">{job.command || 'Unknown Command'}</td>
                    <td className="py-2 text-right text-[#8E9299]">{job.last_run || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-[#8E9299] italic">No active cron jobs</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
