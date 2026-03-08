import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, AlertTriangle, Info, Search, Filter, ArrowDown, Pause, Play } from 'lucide-react';
import { clsx } from 'clsx';

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  message: string;
}

interface SmartLogViewerProps {
  logs: {
    tail: string[];
  };
  className?: string;
}

export function SmartLogViewer({ logs, className }: SmartLogViewerProps) {
  const [filter, setFilter] = useState<'ALL' | 'ERROR' | 'WARN' | 'INFO'>('ALL');
  const [search, setSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Parse logs
  const parsedLogs: LogEntry[] = logs.tail.map(line => {
    const match = line.match(/^\[(INFO|WARN|ERROR|SUCCESS)\]\s*(.*)$/);
    return {
      timestamp: new Date().toLocaleTimeString(), // Mock timestamp if not present
      level: match ? match[1] as any : 'INFO',
      message: match ? match[2] : line
    };
  });

  // Calculate insights
  const errorCount = parsedLogs.filter(l => l.level === 'ERROR').length;
  const warnCount = parsedLogs.filter(l => l.level === 'WARN').length;
  const infoCount = parsedLogs.filter(l => l.level === 'INFO' || l.level === 'SUCCESS').length;

  // Filter logs
  const filteredLogs = parsedLogs.filter(log => {
    if (filter !== 'ALL' && log.level !== filter) return false;
    if (search && !log.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll, filter]);

  return (
    <div className={clsx("flex flex-col h-full bg-[#151619] border border-[#2A2B30] rounded-lg overflow-hidden", className)}>
      {/* Header / Insights */}
      <div className="p-4 border-b border-[#2A2B30] bg-[#09090B]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-[#8E9299]" />
            LOG INTELLIGENCE
          </h3>
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#151619] border border-[#2A2B30] rounded px-3 py-1 text-xs text-white placeholder-[#8E9299] focus:outline-none focus:border-white transition-colors"
            />
            <button 
              onClick={() => setAutoScroll(!autoScroll)}
              className={clsx("p-1.5 rounded transition-colors", {
                "text-green-500 hover:bg-green-500/10": autoScroll,
                "text-[#8E9299] hover:text-white hover:bg-[#2A2B30]": !autoScroll
              })}
              title={autoScroll ? "Pause Auto-Scroll" : "Resume Auto-Scroll"}
            >
              {autoScroll ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <InsightCard 
            icon={<AlertCircle className="w-4 h-4" />} 
            label="ERRORS" 
            count={errorCount} 
            active={filter === 'ERROR'}
            onClick={() => setFilter(filter === 'ERROR' ? 'ALL' : 'ERROR')}
            color="red"
          />
          <InsightCard 
            icon={<AlertTriangle className="w-4 h-4" />} 
            label="WARNINGS" 
            count={warnCount} 
            active={filter === 'WARN'}
            onClick={() => setFilter(filter === 'WARN' ? 'ALL' : 'WARN')}
            color="yellow"
          />
          <InsightCard 
            icon={<Info className="w-4 h-4" />} 
            label="INFO" 
            count={infoCount} 
            active={filter === 'INFO'}
            onClick={() => setFilter(filter === 'INFO' ? 'ALL' : 'INFO')}
            color="blue"
          />
        </div>
      </div>

      {/* Log Stream */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 bg-[#09090B]"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-[#8E9299] text-center italic py-8">No logs found matching criteria.</div>
        ) : (
          filteredLogs.map((log, i) => (
            <div key={i} className="flex gap-3 hover:bg-[#151619] px-2 py-0.5 rounded transition-colors group">
              <span className="text-[#8E9299] w-16 shrink-0">{log.timestamp}</span>
              <span className={clsx("w-16 shrink-0 font-bold", {
                "text-red-500": log.level === 'ERROR',
                "text-yellow-500": log.level === 'WARN',
                "text-blue-400": log.level === 'INFO',
                "text-green-500": log.level === 'SUCCESS'
              })}>
                {log.level}
              </span>
              <span className="text-gray-300 break-all group-hover:text-white transition-colors">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface InsightCardProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color: 'red' | 'yellow' | 'blue';
}

function InsightCard({ icon, label, count, active, onClick, color }: InsightCardProps) {
  return (
    <button 
      onClick={onClick}
      className={clsx("flex items-center justify-between p-3 rounded border transition-all", {
        "bg-[#151619] border-[#2A2B30] hover:border-white/20": !active,
        "bg-red-500/10 border-red-500 text-red-500": active && color === 'red',
        "bg-yellow-500/10 border-yellow-500 text-yellow-500": active && color === 'yellow',
        "bg-blue-500/10 border-blue-500 text-blue-500": active && color === 'blue'
      })}
    >
      <div className="flex items-center gap-2">
        <div className={clsx("p-1 rounded", {
          "bg-red-500/20 text-red-500": color === 'red',
          "bg-yellow-500/20 text-yellow-500": color === 'yellow',
          "bg-blue-500/20 text-blue-500": color === 'blue'
        })}>
          {icon}
        </div>
        <span className="text-xs font-bold font-mono text-[#8E9299]">{label}</span>
      </div>
      <span className={clsx("text-lg font-mono font-bold", {
        "text-white": !active,
        "text-red-500": active && color === 'red',
        "text-yellow-500": active && color === 'yellow',
        "text-blue-500": active && color === 'blue'
      })}>
        {count}
      </span>
    </button>
  );
}
