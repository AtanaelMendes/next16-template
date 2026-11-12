'use client';

import { useId, useState } from 'react';

const SLA_COLORS = ['#FFD248', '#fc6868', '#fc0505'];

const XyVerticalChart = ({ chartData = [], nmChart, width = '100%', height = '300px' }) => {
  const generatedId = useId();
  const id = nmChart || `xy-vertical-${generatedId}`;
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!chartData || chartData.length === 0) {
    return (
      <div id={id} style={{ width, height }} className="flex items-center justify-center text-sm text-gray-400">
        Nenhum dado disponível
      </div>
    );
  }

  const svgWidth = 600;
  const svgHeight = 280;
  const padding = { top: 30, right: 30, bottom: 45, left: 45 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const maxValue = Math.max(5, ...chartData.map(d => Number(d.value) || 0));
  const maxY = Math.ceil(maxValue * 1.2);

  const count = chartData.length;
  const slotWidth = plotWidth / count;
  const colWidth = Math.min(85, slotWidth * 0.65);

  return (
    <div id={id} style={{ width, height }} className="relative flex flex-col items-center justify-center select-none">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full overflow-visible"
        role="img"
        aria-label="Gráfico de Colunas SLA de Vagas"
      >
        <title>SLA de Vagas</title>

        {/* Linhas de grade horizontais e valores Y */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const val = Math.round(maxY * pct);
          const y = padding.top + plotHeight * (1 - pct);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + plotWidth}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] fill-gray-400 font-mono"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Colunas por status SLA */}
        {chartData.map((item, index) => {
          const val = Number(item.value) || 0;
          const barHeight = Math.max(0, (val / maxY) * plotHeight);
          const barX = padding.left + index * slotWidth + (slotWidth - colWidth) / 2;
          const barY = padding.top + plotHeight - barHeight;
          const fillColor = SLA_COLORS[index % SLA_COLORS.length];
          const isHovered = hoveredIndex === index;
          const labelTextColor = index === 2 ? '#ffffff' : '#1f2937';

          return (
            <g
              key={index}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer"
            >
              {/* Barra da coluna */}
              <rect
                x={barX}
                y={barY}
                width={colWidth}
                height={barHeight}
                fill={fillColor}
                rx="6"
                stroke="#ffffff"
                strokeWidth="2"
                className="transition-all duration-200"
                opacity={isHovered ? 0.9 : 1}
              />

              {/* Rótulo de texto centralizado dentro da coluna "{value} vaga(s)" */}
              {val > 0 && barHeight > 24 && (
                <text
                  x={barX + colWidth / 2}
                  y={barY + barHeight / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-[11px] font-bold select-none pointer-events-none"
                  fill={labelTextColor}
                >
                  {val} vaga(s)
                </text>
              )}

              {/* Se a barra for muito baixa para o texto interno */}
              {val > 0 && barHeight <= 24 && (
                <text
                  x={barX + colWidth / 2}
                  y={barY - 8}
                  textAnchor="middle"
                  className="text-[11px] font-bold fill-gray-700 select-none pointer-events-none"
                >
                  {val} vaga(s)
                </text>
              )}

              {/* Rótulo do eixo X */}
              <text
                x={barX + colWidth / 2}
                y={padding.top + plotHeight + 20}
                textAnchor="middle"
                className="text-[11px] font-medium fill-gray-600 select-none"
              >
                {item.label || item.name}
              </text>

              {/* Tooltip no hover */}
              {isHovered && (
                <g transform={`translate(${barX + colWidth / 2}, ${Math.max(15, barY - 14)})`}>
                  <rect
                    x="-45"
                    y="-18"
                    width="90"
                    height="20"
                    rx="4"
                    fill="#1f2937"
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    y="-8"
                    className="text-[11px] font-semibold fill-white select-none"
                  >
                    {val} vaga(s)
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default XyVerticalChart;
