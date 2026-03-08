import React, { useRef, useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { FileText, Download, Trash2, ArrowDownCircle } from 'lucide-react';

interface LogViewerProps {
  logs: {
    total_lines: number;
    size_mb: number;
    tail: string[];
  };
  className?: string;
}

export function LogViewer({ logs, className }: LogViewerProps) {
  const logEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs.tail, autoScroll]);

  return (
    <div className={twMerge("bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm h-full flex flex-col", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#8E9299]" />
          <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider">Gateway Logs</h3>
        </div>
        <div className="flex items-center gap-4 text-[#8E9299] text-xs font-mono">
          <span>{logs.total_lines} lines</span>
          <span>{logs.size_mb} MB</span>
          <button 
            onClick={() => setAutoScroll(!autoScroll)}
            className={clsx("flex items-center gap-1 transition-colors", {
              "text-green-500": autoScroll,
              "text-[#8E9299] hover:text-white": !autoScroll
            })}
            title={autoScroll ? "Auto-scroll ON" : "Auto-scroll OFF"}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Auto-scroll</span>
          </button>
          <button className="hover:text-white transition-colors">
            <Download className="w-4 h-4" />
          </button>
          <button className="hover:text-red-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-[#09090B] border border-[#2A2B30] rounded p-4 overflow-y-auto font-mono text-xs custom-scrollbar">
        {logs.tail && logs.tail.length > 0 ? (
          logs.tail.map((line, i) => (
            <div key={i} className="mb-1 break-all hover:bg-[#1A1B1F] px-1 rounded transition-colors">
              <span className="text-[#8E9299] mr-2">[{i + 1}]</span>
              <span className={clsx({
                "text-red-400": line.includes("ERROR") || line.includes("FATAL"),
                "text-yellow-400": line.includes("WARN"),
                "text-blue-400": line.includes("INFO"),
                "text-green-400": line.includes("SUCCESS"),
                "text-gray-400": !line.match(/(ERROR|FATAL|WARN|INFO|SUCCESS)/)
              })}>
                {line}
              </span>
            </div>
          ))
        ) : (
          <div className="text-[#8E9299] italic text-center mt-10">No logs available</div>
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
