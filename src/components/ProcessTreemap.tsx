import React from 'react';
import { Treemap, Tooltip, ResponsiveContainer } from 'recharts';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { OpenClawProcess } from '../types';

interface ProcessTreemapProps {
  processes: OpenClawProcess[];
  className?: string;
}

export function ProcessTreemap({ processes, className }: ProcessTreemapProps) {
  if (!processes || processes.length === 0) return null;

  // Transform processes for Treemap
  const data = processes.map(p => ({
    name: p.name,
    size: p.mem_mb, // Size = Memory
    cpu: p.cpu_pct, // Color = CPU
    pid: p.pid
  }));

  // Custom content for Treemap cells
  const renderCustomizedContent = (props: any) => {
    const { root, depth, x, y, width, height, index, payload, colors, rank, name, value } = props;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: depth < 2 ? colors[Math.floor((index / root.children.length) * 6)] : 'none',
            stroke: '#fff',
            strokeWidth: 2 / (depth + 1e-10),
            strokeOpacity: 1 / (depth + 1e-10),
          }}
        />
        {depth === 1 ? (
          <text
            x={x + width / 2}
            y={y + height / 2 + 7}
            textAnchor="middle"
            fill="#fff"
            fontSize={14}
          >
            {name}
          </text>
        ) : null}
        {depth === 1 ? (
          <text
            x={x + 4}
            y={y + 18}
            fill="#fff"
            fontSize={16}
            fillOpacity={0.9}
          >
            {index + 1}
          </text>
        ) : null}
      </g>
    );
  };

  return (
    <div className={twMerge("bg-[#151619] border border-[#2A2B30] rounded-lg p-4 shadow-sm", className)}>
      <h3 className="text-[#8E9299] text-xs font-mono uppercase tracking-wider mb-4">Process Resource Treemap</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            width={400}
            height={200}
            data={data}
            dataKey="size"
            stroke="#fff"
            fill="#8884d8"
            content={<CustomContent />}
          >
            <Tooltip 
              contentStyle={{ backgroundColor: '#1A1B1F', border: '1px solid #2A2B30', borderRadius: '4px' }}
              itemStyle={{ fontSize: '12px', fontFamily: 'monospace' }}
              labelStyle={{ color: '#8E9299', marginBottom: '4px' }}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const CustomContent = (props: any) => {
  const { x, y, width, height, name, cpu, size } = props;
  
  // Color scale based on CPU usage
  const color = cpu > 50 ? '#EF4444' : cpu > 20 ? '#F59E0B' : '#3B82F6';
  
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: color,
          stroke: '#151619',
          strokeWidth: 2,
        }}
      />
      {width > 50 && height > 30 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 5}
            textAnchor="middle"
            fill="#fff"
            fontSize={12}
            fontWeight="bold"
            fontFamily="monospace"
          >
            {name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 10}
            textAnchor="middle"
            fill="#fff"
            fontSize={10}
            fontFamily="monospace"
            opacity={0.8}
          >
            {cpu}% CPU
          </text>
        </>
      )}
    </g>
  );
};
