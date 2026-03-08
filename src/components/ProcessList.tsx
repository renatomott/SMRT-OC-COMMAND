import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface Process {
  pid: number;
  name: string;
  status: string;
  cpu?: number;
  memory?: number;
}

interface ProcessListProps {
  processes: Process[];
  className?: string;
}

export function ProcessList({ processes, className }: ProcessListProps) {
  return (
    <div className={twMerge("bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm", className)}>
      <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider mb-4">Active Processes</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-[#2A2B30] text-[#8E9299]">
              <th className="pb-2 font-normal">PID</th>
              <th className="pb-2 font-normal">NAME</th>
              <th className="pb-2 font-normal">STATUS</th>
              <th className="pb-2 font-normal text-right">CPU</th>
              <th className="pb-2 font-normal text-right">MEM</th>
            </tr>
          </thead>
          <tbody className="text-white">
            {processes.map((process, index) => (
              <tr key={process.pid} className={clsx("border-b border-[#2A2B30] last:border-0 hover:bg-[#1E1F23] transition-colors", {
                "bg-[#1A1B1F]": index % 2 === 0
              })}>
                <td className="py-2 text-[#8E9299]">{process.pid}</td>
                <td className="py-2 font-bold">{process.name}</td>
                <td className="py-2">
                  <span className={clsx("px-2 py-0.5 rounded text-[10px] uppercase", {
                    "bg-green-500/10 text-green-500": process.status === 'running',
                    "bg-yellow-500/10 text-yellow-500": process.status === 'sleeping',
                    "bg-red-500/10 text-red-500": process.status === 'stopped'
                  })}>
                    {process.status}
                  </span>
                </td>
                <td className="py-2 text-right text-[#8E9299]">{process.cpu ? `${process.cpu}%` : '-'}</td>
                <td className="py-2 text-right text-[#8E9299]">{process.memory ? `${process.memory}MB` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
