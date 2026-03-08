import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ActivityHeatmapProps {
  history: any[];
  className?: string;
}

export function ActivityHeatmap({ history, className }: ActivityHeatmapProps) {
  if (!history || history.length === 0) return null;

  // Simulate a 24-hour heatmap from the limited history
  // In a real app, this would use aggregated historical data
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className={twMerge("bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm", className)}>
      <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider mb-4">Activity Heatmap (Simulated)</h3>
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <div className="flex flex-col justify-between text-[#8E9299] text-[10px] font-mono pr-2">
          {days.map(day => <span key={day}>{day}</span>)}
        </div>
        <div className="grid grid-cols-24 gap-1">
          {days.map((day, dIndex) => (
            hours.map((hour, hIndex) => {
              // Simulate intensity based on time of day (peak at 14h-16h)
              const intensity = Math.random() * (hour > 12 && hour < 18 ? 100 : 30);
              return (
                <div 
                  key={`${dIndex}-${hIndex}`}
                  className={clsx("w-full h-4 rounded-sm transition-opacity hover:opacity-80", {
                    "bg-[#1A1B1F]": intensity < 10,
                    "bg-green-900/40": intensity >= 10 && intensity < 30,
                    "bg-green-700/60": intensity >= 30 && intensity < 60,
                    "bg-green-500/80": intensity >= 60 && intensity < 80,
                    "bg-green-400": intensity >= 80
                  })}
                  title={`${day} ${hour}:00 - ${intensity.toFixed(0)} sessions`}
                />
              );
            })
          ))}
        </div>
      </div>
      <div className="flex justify-between mt-2 text-[#8E9299] text-[10px] font-mono pl-8">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>
    </div>
  );
}
