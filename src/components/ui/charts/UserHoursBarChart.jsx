'use client';
import React, { useMemo } from 'react';

/**
 * UserHoursBarChart — gráfico de barras horizontais SVG.
 *
 * Props:
 *   data:  Array<{ user: string, hours: number, color?: string }>
 *   title?: string
 *   height?: string
 */
const DEFAULT_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function UserHoursBarChart({ data = [], title, height = '260px' }) {
  const max = useMemo(() => Math.max(...data.map(d => Number(d.hours) || 0), 1), [data]);

  const W = 280;
  const rowH = 28;
  const H = data.length * rowH + 20;
  const labelW = 70;
  const barAreaW = W - labelW - 50;

  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-gray-400 text-sm" style={{ height }}>
        Sem dados para exibir
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full" style={{ height }}>
      {title && <p className="text-sm font-semibold text-gray-700 mb-2 text-center dark:text-gray-200">{title}</p>}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xs" style={{ maxHeight: 'calc(100% - 24px)' }}>
        {data.map((d, i) => {
          const val = Number(d.hours) || 0;
          const bw = (val / max) * barAreaW;
          const y = i * rowH + 8;
          const c = d.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
          return (
            <g key={i}>
              <text x={0} y={y + 12} fontSize="10" fill="#374151" dominantBaseline="middle">
                {d.user}
              </text>
              <rect x={labelW} y={y} width={bw} height={16} fill={c} rx="3">
                <title>{`${d.user}: ${val}h`}</title>
              </rect>
              <text x={labelW + bw + 4} y={y + 12} fontSize="9" fill="#6b7280" dominantBaseline="middle">
                {val}h
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
