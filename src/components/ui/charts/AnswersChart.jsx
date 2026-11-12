'use client';

import { useId, useState } from 'react';

function normalizeColor(fill) {
  if (typeof fill === 'number') {
    return `#${fill.toString(16).padStart(6, '0')}`;
  }
  if (typeof fill === 'string') {
    if (fill.startsWith('0x')) {
      return `#${fill.slice(2).padStart(6, '0')}`;
    }
    return fill;
  }
  return '#3b82f6';
}

const AnswersChart = ({ chartId, chartData = [], height = '150px' }) => {
  const generatedId = useId();
  const id = chartId || `answers-${generatedId}`;
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!chartData || chartData.length === 0) {
    return (
      <div id={id} style={{ width: '100%', height }} className="flex items-center justify-center text-sm text-gray-400">
        Nenhum dado disponível
      </div>
    );
  }

  const svgWidth = 500;
  const svgHeight = 240;
  const padding = { top: 60, right: 30, bottom: 40, left: 30 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const maxY = Math.max(400, ...chartData.map(d => Number(d.value) || 0));
  const count = chartData.length;
  const colWidth = Math.min(80, plotWidth / (count * 1.6));
  const slotWidth = plotWidth / count;

  return (
    <div id={id} style={{ width: '100%', height }} className="relative flex items-center justify-center">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full overflow-visible"
        role="img"
        aria-label="Gráfico de Perguntas Respondidas e Metas"
      >
        <title>Perguntas Respondidas e Metas</title>

        {/* Linha base */}
        <line
          x1={padding.left}
          y1={padding.top + plotHeight}
          x2={padding.left + plotWidth}
          y2={padding.top + plotHeight}
          stroke="#e2e8f0"
          strokeWidth="1.5"
        />

        {chartData.map((item, index) => {
          const val = Number(item.value) || 0;
          const barHeight = Math.max(0, (val / maxY) * plotHeight);
          const barX = padding.left + index * slotWidth + (slotWidth - colWidth) / 2;
          const barY = padding.top + plotHeight - barHeight;
          const fillColor = normalizeColor(item.columnSettings?.fill || item.fill);
          const isHovered = hoveredIndex === index;

          return (
            <g
              key={index}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer transition-transform duration-200"
            >
              {/* Barra da coluna */}
              <rect
                x={barX}
                y={barY}
                width={colWidth}
                height={barHeight}
                fill={fillColor}
                rx="4"
                stroke="#ffffff"
                strokeWidth="2"
                className="transition-opacity duration-200"
                opacity={isHovered ? 0.9 : 1}
              />

              {/* Rótulo da categoria no eixo X */}
              <text
                x={barX + colWidth / 2}
                y={padding.top + plotHeight + 24}
                textAnchor="middle"
                className="text-[12px] font-medium fill-gray-600 select-none"
              >
                {item.category}
              </text>

              {/* Target Bullet: Meta circular a 50% da altura da coluna */}
              {item.targetBullet && (
                <g transform={`translate(${barX + colWidth / 2}, ${barY + barHeight * 0.5})`}>
                  <circle r="22" fill="#11326d" stroke="#ffffff" strokeWidth="2.5" />
                  <text
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[11px] font-bold fill-white select-none"
                  >
                    Meta
                  </text>
                </g>
              )}

              {/* Current Bullet: Pin marcador com balão de valor no topo da coluna */}
              {item.currentBullet && (
                <g transform={`translate(${barX + colWidth / 2}, ${barY})`}>
                  {/* Pin SVG */}
                  <g transform="translate(-18, -46) scale(0.4)">
                    <path
                      d="M66.9 41.8c0-11.3-9.1-20.4-20.4-20.4-11.3 0-20.4 9.1-20.4 20.4 0 11.3 20.4 32.4 20.4 32.4s20.4-21.1 20.4-32.4z"
                      fill={fillColor}
                    />
                    <circle cx="46.5" cy="41.4" r="9.5" fill="#ffffff" />
                  </g>

                  {/* Balão com o valor numérico acima do pin */}
                  <g transform="translate(0, -42)">
                    <rect
                      x="-24"
                      y="-18"
                      width="48"
                      height="22"
                      rx="8"
                      fill="#ffffff"
                      stroke="#e2e8f0"
                      strokeWidth="1.5"
                      className="shadow-sm filter drop-shadow(0 1px 2px rgba(0,0,0,0.1))"
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      y="-7"
                      className="text-[11px] font-bold fill-gray-800 select-none"
                    >
                      {val}
                    </text>
                  </g>
                </g>
              )}

              {/* Tooltip flutuante no hover (se não for currentBullet) */}
              {isHovered && !item.currentBullet && (
                <g transform={`translate(${barX + colWidth / 2}, ${Math.max(15, barY - 15)})`}>
                  <rect
                    x="-30"
                    y="-18"
                    width="60"
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
                    {val}
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

export default AnswersChart;
