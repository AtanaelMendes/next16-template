'use client';

import { useId, useMemo, useState } from 'react';

const PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

const PieChart = ({ chartData = [], nmChart, width = '100%', height = '300px' }) => {
  const generatedId = useId();
  const id = nmChart || `pie-${generatedId}`;
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const { slices, total } = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { slices: [], total: 0 };
    }

    const sum = chartData.reduce((acc, cur) => acc + (Number(cur.value) || 0), 0);
    if (sum === 0) return { slices: [], total: 0 };

    let currentAngle = -Math.PI / 2; // Começa no topo (12 horas)
    const R = 95; // Raio externo
    const r = 52; // Raio interno (efeito donut moderno)
    const cx = 200;
    const cy = 125;

    const computedSlices = chartData.map((item, index) => {
      const val = Number(item.value) || 0;
      const angleDelta = (val / sum) * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleDelta;
      const midAngle = startAngle + angleDelta / 2;
      currentAngle = endAngle;

      const x1 = cx + R * Math.cos(startAngle);
      const y1 = cy + R * Math.sin(startAngle);
      const x2 = cx + R * Math.cos(endAngle);
      const y2 = cy + R * Math.sin(endAngle);

      const ix1 = cx + r * Math.cos(endAngle);
      const iy1 = cy + r * Math.sin(endAngle);
      const ix2 = cx + r * Math.cos(startAngle);
      const iy2 = cy + r * Math.sin(startAngle);

      const largeArc = angleDelta > Math.PI ? 1 : 0;
      const pathD = `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${r} ${r} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;

      const color = item.color || PALETTE[index % PALETTE.length];
      const pct = Math.round((val / sum) * 100);

      // Deslocamento para hover
      const offsetDist = 5;
      const dx = offsetDist * Math.cos(midAngle);
      const dy = offsetDist * Math.sin(midAngle);

      return {
        ...item,
        value: val,
        percentage: pct,
        color,
        pathD,
        dx,
        dy,
        midAngle,
      };
    });

    return { slices: computedSlices, total: sum };
  }, [chartData]);

  if (!chartData || chartData.length === 0 || total === 0) {
    return (
      <div id={id} style={{ width, height }} className="flex items-center justify-center text-sm text-gray-400">
        Nenhum dado disponível
      </div>
    );
  }

  const activeSlice = hoveredIndex !== null ? slices[hoveredIndex] : null;

  return (
    <div id={id} style={{ width, height }} className="relative flex flex-col items-center justify-center select-none">
      <svg
        viewBox="0 0 400 250"
        className="w-full h-full max-h-[250px] overflow-visible"
        role="img"
        aria-label="Gráfico de Rosca de Distribuição"
      >
        <title>Distribuição Percentual</title>

        {/* Fatias do Donut */}
        <g>
          {slices.map((slice, index) => {
            const isHovered = hoveredIndex === index;
            return (
              <path
                key={index}
                d={slice.pathD}
                fill={slice.color}
                stroke="#ffffff"
                strokeWidth="2"
                transform={isHovered ? `translate(${slice.dx}, ${slice.dy})` : 'translate(0, 0)'}
                className="transition-transform duration-200 cursor-pointer"
                opacity={hoveredIndex === null || isHovered ? 1 : 0.65}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <title>{`${slice.label}: ${slice.value} (${slice.percentage}%)`}</title>
              </path>
            );
          })}
        </g>

        {/* Centro com texto informativo */}
        <g transform="translate(200, 125)" className="pointer-events-none">
          {activeSlice ? (
            <>
              <text textAnchor="middle" y="-6" className="text-[12px] font-medium fill-gray-500">
                {activeSlice.label}
              </text>
              <text textAnchor="middle" y="16" className="text-[18px] font-bold fill-gray-800">
                {activeSlice.percentage}%
              </text>
              <text textAnchor="middle" y="32" className="text-[10px] fill-gray-400">
                ({activeSlice.value})
              </text>
            </>
          ) : (
            <>
              <text textAnchor="middle" y="-2" className="text-[11px] font-medium fill-gray-400">
                Total
              </text>
              <text textAnchor="middle" y="18" className="text-[18px] font-bold fill-gray-800">
                {total}
              </text>
            </>
          )}
        </g>
      </svg>

      {/* Legenda em grade no rodapé */}
      <div className="flex flex-wrap justify-center items-center gap-3 mt-1 max-w-[380px]">
        {slices.map((slice, index) => {
          const isHovered = hoveredIndex === index;
          return (
            <div
              key={index}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center space-x-1.5 text-xs px-2 py-0.5 rounded cursor-pointer transition-all ${
                isHovered ? 'bg-gray-100 font-semibold' : 'text-gray-600'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
              <span>{slice.label}:</span>
              <span className="text-gray-900 font-bold">{slice.value}</span>
              <span className="text-gray-400 text-[10px]">({slice.percentage}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PieChart;
