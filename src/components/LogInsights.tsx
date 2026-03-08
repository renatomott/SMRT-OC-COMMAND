import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface LogInsightsProps {
  logs: string[];
  className?: string;
}

export function LogInsights({ logs, className }: LogInsightsProps) {
  if (!logs || logs.length === 0) return null;

  // Simple clustering logic
  const clusters = logs.reduce((acc, log) => {
    // Remove timestamps and IDs to find patterns
    const pattern = log.replace(/\[.*?\]/g, '').replace(/\d+/g, 'X').trim();
    acc[pattern] = (acc[pattern] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedClusters = Object.entries(clusters)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5); // Top 5

  return (
    <div className={twMerge("bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm", className)}>
      <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider mb-4">Log Insights & Clusters</h3>
      <div className="space-y-2">
        {sortedClusters.map(([pattern, count], i) => (
          <div key={i} className="flex justify-between items-center bg-[#1A1B1F] p-2 rounded border border-[#2A2B30]">
            <span className="text-white text-xs font-mono truncate max-w-[80%]">{pattern}</span>
            <span className={clsx("text-xs font-bold px-2 py-0.5 rounded", {
              "bg-red-500/20 text-red-500": count > 10,
              "bg-yellow-500/20 text-yellow-500": count > 5 && count <= 10,
              "bg-blue-500/20 text-blue-500": count <= 5
            })}>
              {count}x
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
