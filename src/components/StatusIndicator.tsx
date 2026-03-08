import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'error' | 'warning' | 'degraded';
  label?: string;
  className?: string;
}

export function StatusIndicator({ status, label, className }: StatusIndicatorProps) {
  return (
    <div className={twMerge("flex items-center gap-2 font-mono text-xs uppercase tracking-wider", className)}>
      <div className={clsx("w-2 h-2 rounded-full animate-pulse", {
        "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]": status === 'online',
        "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]": status === 'error' || status === 'offline',
        "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]": status === 'warning' || status === 'degraded',
      })} />
      <span className={clsx({
        "text-green-500": status === 'online',
        "text-red-500": status === 'error' || status === 'offline',
        "text-yellow-500": status === 'warning' || status === 'degraded',
        "text-[#8E9299]": !status
      })}>
        {label || status}
      </span>
    </div>
  );
}
