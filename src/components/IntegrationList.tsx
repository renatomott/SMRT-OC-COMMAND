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
  if (!data) return null;

  const envKeys = data.config?.[".env"] ? Object.keys(data.config[".env"]) : (data.integrations?.env_keys || []);
  const ollamaModels = data.rich?.ollama_models?.map(m => m.name) || data.ollama?.models || [];
  const cronJobs = data.rich?.cron_jobs?.jobs || data.cron?.jobs || [];
  const cronCount = data.rich?.cron_jobs?.count || data.cron?.count || 0;

  return (
    <div className={twMerge("grid grid-cols-1 md:grid-cols-2 gap-6", className)}>
      {/* Environment Keys */}
      <div className="bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-4 h-4 text-[#8E9299]" />
          <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider">Configured Integrations</h3>
        </div>
        <ul className="space-y-2 font-mono text-xs max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {envKeys.length ? (
            envKeys.map((key, i) => (
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
          {ollamaModels.length ? (
            ollamaModels.map((model, i) => (
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#8E9299]" />
            <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider">Cron Jobs</h3>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span className="text-[#8E9299]">{cronCount} total</span>
            <span className="text-green-400">{cronJobs.filter(j => !j.consecutive_errors || j.consecutive_errors === 0).length} ok</span>
            {cronJobs.filter(j => (j.consecutive_errors || 0) > 0).length > 0 && (
              <span className="text-red-400 font-bold">
                {cronJobs.filter(j => (j.consecutive_errors || 0) > 0).length} com erro
              </span>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[#2A2B30] text-[#8E9299]">
                <th className="pb-2.5 pr-4 font-medium text-left">NOME</th>
                <th className="pb-2.5 pr-4 font-medium text-left">SCHEDULE</th>
                <th className="pb-2.5 px-3 font-medium text-center">STATUS</th>
                <th className="pb-2.5 px-3 font-medium text-right">ÚLTIMO RUN</th>
                <th className="pb-2.5 px-3 font-medium text-right">PRÓXIMO</th>
                <th className="pb-2.5 px-3 font-medium text-right">DURAÇÃO</th>
                <th className="pb-2.5 pl-3 font-medium text-center">ERROS</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {cronJobs.length ? (
                cronJobs.map((job, i) => {
                  const hasError = (job.consecutive_errors || 0) > 0;
                  const status = job.last_run_status;
                  const isOk = !status || status === 'success' || status === 'ok';
                  return (
                    <tr key={i} className={clsx(
                      "border-b border-[#2A2B30] last:border-0 transition-colors",
                      hasError ? "bg-red-500/5 hover:bg-red-500/10" : "hover:bg-[#1E1F23]"
                    )}>
                      <td className="py-2.5 font-bold text-white">{job.name || job.command || '—'}</td>
                      <td className="py-2.5 text-yellow-400 font-bold">{job.schedule}</td>
                      <td className="py-2.5 text-center">
                        <span className={clsx('px-2 py-0.5 rounded text-[10px] uppercase font-bold', {
                          'bg-green-500/10 text-green-400': isOk && !hasError,
                          'bg-red-500/10 text-red-400': !isOk || hasError,
                          'bg-[#2A2B30] text-[#8E9299]': !status,
                        })}>
                          {status || '—'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#8E9299] whitespace-nowrap">
                        {job.last_run_at ? new Date(job.last_run_at).toLocaleString('pt-BR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : job.last_run || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#8E9299] whitespace-nowrap">
                        {job.next_run_at ? new Date(job.next_run_at).toLocaleString('pt-BR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#8E9299] whitespace-nowrap">
                        {job.last_duration_s != null ? `${job.last_duration_s.toFixed(1)}s` : '—'}
                      </td>
                      <td className="py-2.5 pl-3 text-center">
                        <span className={clsx('font-bold text-xs', {
                          'text-green-400': (job.consecutive_errors || 0) === 0,
                          'text-yellow-400': (job.consecutive_errors || 0) === 1,
                          'text-red-400': (job.consecutive_errors || 0) > 1,
                        })}>
                          {job.consecutive_errors || 0}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-[#8E9299] italic">Nenhum cron job encontrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
