'use client';
import React, { useMemo } from 'react';

/**
 * PieChart — gráfico de pizza SVG nativo, sem dependências externas.
 *
 * Props (modo simples via `data`):
 *   data: Array<{ label: string, value: number, color?: string }>
 *   title?: string
 *   height?: string  (CSS, ex: "280px")
 *
 * Props (modo legado via `chartData` / `nmChart`):
 *   chartData: Array<{ label: string, value: number, color?: string }>
 *   nmChart?: string   (usado como key/id interno)
 *   height?: string
 */
const DEFAULT_COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#f97316', '#ec4899',
];

export default function PieChart({ data, chartData, nmChart, title, height = '260px' }) {
  const items = useMemo(() => {
    const src = data || chartData || [];
    return src.map((d, i) => ({
      label: d.label ?? '',
      value: Number(d.value) || 0,
      color: d.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    }));
  }, [data, chartData]);

  const total = useMemo(() => items.reduce((s, d) => s + d.value, 0), [items]);

  // Build pie slices
  const slices = useMemo(() => {
    let angle = -Math.PI / 2;
    return items.map((item) => {
      const ratio = total > 0 ? item.value / total : 0;
      const startAngle = angle;
      angle += ratio * 2 * Math.PI;
      const endAngle = angle;
      return { ...item, ratio, startAngle, endAngle };
    });
  }, [items, total]);

  const r = 80;
  const cx = 100;
  const cy = 100;
  const normalizeCoordinate = (value) => Number(value.toFixed(6));

  const polarToCartesian = (angle, radius = r) => ({
    x: normalizeCoordinate(cx + radius * Math.cos(angle)),
    y: normalizeCoordinate(cy + radius * Math.sin(angle)),
  });

  const describeSlice = (startAngle, endAngle) => {
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
  };

  if (!items.length || total === 0) {
    return (
      <div className="flex items-center justify-center text-gray-400 text-sm" style={{ height }}>
        Sem dados para exibir
      </div>
    );
  }

  return (
    <div id={nmChart} className="flex flex-col items-center w-full" style={{ height }}>
      {title && <p className="text-sm font-semibold text-gray-700 mb-2 text-center dark:text-gray-200">{title}</p>}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
        <svg viewBox="0 0 200 200" className="w-36 h-36 shrink-0">
          {slices.map((s, i) => (
            <path
              key={i}
              d={describeSlice(s.startAngle, s.endAngle)}
              fill={s.color}
              stroke="white"
              strokeWidth="2"
            >
              <title>{`${s.label}: ${s.value} (${(s.ratio * 100).toFixed(1)}%)`}</title>
            </path>
          ))}
          <circle cx={cx} cy={cy} r={36} fill="white" />
          <text x={cx} y={cy - 6} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1e293b">{total}</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill="#64748b">total</text>
        </svg>
        <ul className="flex flex-col gap-1.5 text-xs min-w-0 flex-1">
          {slices.map((s, i) => (
            <li key={i} className="flex items-center gap-2 truncate">
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: s.color }} />
              <span className="text-gray-700 truncate dark:text-gray-300">{s.label}</span>
              <span className="ml-auto font-semibold text-gray-800 shrink-0 dark:text-gray-100">
                {(s.ratio * 100).toFixed(0)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
