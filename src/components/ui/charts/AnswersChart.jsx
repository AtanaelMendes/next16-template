'use client';
import React, { useMemo } from 'react';

/**
 * AnswersChart — gráfico de barras verticais SVG.
 *
 * Props:
 *   data:  Array<{ label: string, value: number, total?: number, color?: string }>
 *   title?: string
 *   height?: string  (CSS)
 *   color?: string   (cor padrão das barras)
 */
export default function AnswersChart({ data = [], title, height = '260px', color = '#3b82f6' }) {
  const max = useMemo(() => Math.max(...data.map(d => Number(d.value) || 0), 1), [data]);

  const W = 300;
  const H = 160;
  const PAD = { top: 10, right: 10, bottom: 28, left: 32 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const barW = data.length > 0 ? Math.max(10, (chartW / data.length) * 0.6) : 20;
  const gap = data.length > 0 ? chartW / data.length : 30;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(r => ({
    y: PAD.top + chartH * (1 - r),
    label: Math.round(max * r),
  }));

  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-gray-400 text-sm" style={{ height }}>
        Sem dados para exibir
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full" style={{ height }}>
      {title && <p className="text-sm font-semibold text-gray-700 mb-2 text-center">{title}</p>}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xs" style={{ maxHeight: 'calc(100% - 24px)' }}>
        {/* Y ticks */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={t.y} x2={PAD.left + chartW} y2={t.y} stroke="#e2e8f0" strokeWidth="1" />
            <text x={PAD.left - 4} y={t.y + 4} textAnchor="end" fontSize="8" fill="#94a3b8">{t.label}</text>
          </g>
        ))}
        {/* Bars */}
        {data.map((d, i) => {
          const val = Number(d.value) || 0;
          const barH = (val / max) * chartH;
          const x = PAD.left + i * gap + gap / 2 - barW / 2;
          const y = PAD.top + chartH - barH;
          const barColor = d.color ?? color;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} fill={barColor} rx="2">
                <title>{`${d.label}: ${val}`}</title>
              </rect>
              <text x={x + barW / 2} y={PAD.top + chartH + 14} textAnchor="middle" fontSize="8" fill="#64748b">
                {d.label}
              </text>
              {barH > 14 && (
                <text x={x + barW / 2} y={y + 10} textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">
                  {val}
                </text>
              )}
            </g>
          );
        })}
        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + chartH} stroke="#94a3b8" strokeWidth="1" />
        <line x1={PAD.left} y1={PAD.top + chartH} x2={PAD.left + chartW} y2={PAD.top + chartH} stroke="#94a3b8" strokeWidth="1" />
      </svg>
    </div>
  );
}
