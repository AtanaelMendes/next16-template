'use client';

import { useId, useMemo, useState } from 'react';

const YearlySeriesChart = ({ yearlyData = [], monthlyData = {}, nmChart }) => {
  const generatedId = useId();
  const id = nmChart || `yearly-chart-${generatedId}`;

  const [selectedYear, setSelectedYear] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Determina dados ativos (anual ou mensal do ano selecionado)
  const isMonthly = Boolean(selectedYear && monthlyData[selectedYear]);
  const activeData = useMemo(() => {
    if (isMonthly) {
      return monthlyData[selectedYear] || [];
    }
    return yearlyData || [];
  }, [isMonthly, selectedYear, monthlyData, yearlyData]);

  // Cálculos de variância intercoluna
  const { itemsWithVariance, maxY } = useMemo(() => {
    if (!activeData || activeData.length === 0) {
      return { itemsWithVariance: [], maxY: 10 };
    }

    let maxVal = 10;
    const items = activeData.map((item, idx) => {
      const val = Number(item.value) || 0;
      if (val > maxVal) maxVal = val;

      const nextItem = activeData[idx + 1];
      let variance = null;

      if (nextItem !== undefined) {
        const nextVal = Number(nextItem.value) || 0;
        const diff = nextVal - val;
        const pct = val !== 0 ? Math.round((diff / val) * 100) : 0;
        const isPositive = diff >= 0;
        variance = {
          diff,
          pct,
          isPositive,
          text: `${isPositive ? '+' : ''}${diff} (${isPositive ? '+' : ''}${pct}%)`,
          color: isPositive ? '#16a34a' : '#dc2626',
        };
      }

      return {
        ...item,
        value: val,
        category: isMonthly ? (item.month || item.category) : (item.year || item.category),
        variance,
      };
    });

    return {
      itemsWithVariance: items,
      maxY: Math.ceil(maxVal * 1.3),
    };
  }, [activeData, isMonthly]);

  if (!yearlyData || yearlyData.length === 0) {
    return (
      <div id={id} style={{ width: '100%', height: '300px' }} className="flex items-center justify-center text-sm text-gray-400">
        Nenhum dado disponível
      </div>
    );
  }

  const svgWidth = 700;
  const svgHeight = 270;
  const padding = { top: 40, right: 35, bottom: 45, left: 45 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const count = itemsWithVariance.length;
  const slotWidth = count > 0 ? plotWidth / count : plotWidth;
  const colWidth = Math.min(50, slotWidth * 0.55);

  return (
    <div id={id} style={{ width: '100%', height: '300px' }} className="relative flex flex-col items-center justify-center select-none">
      {/* Botão de alternância / Visão anual */}
      <div className="w-full flex justify-between items-center mb-1 px-4">
        <span className="text-xs font-semibold text-gray-700">
          {isMonthly ? `Detalhamento Mensal: ${selectedYear}` : 'Série Histórica Anual'}
        </span>
        {isMonthly && (
          <button
            onClick={() => setSelectedYear(null)}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1 rounded-md transition-colors shadow-sm flex items-center space-x-1"
          >
            <span>←</span>
            <span>Visão anual</span>
          </button>
        )}
      </div>

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full overflow-visible"
        role="img"
        aria-label="Gráfico de Séries Temporais com Variância"
      >
        <title>Série com Variância</title>

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

        {/* Colunas */}
        {itemsWithVariance.map((item, index) => {
          const barHeight = Math.max(0, (item.value / maxY) * plotHeight);
          const barX = padding.left + index * slotWidth + (slotWidth - colWidth) / 2;
          const barY = padding.top + plotHeight - barHeight;
          const isHovered = hoveredIndex === index;

          return (
            <g
              key={index}
              onClick={() => {
                if (!isMonthly && monthlyData[item.category]) {
                  setSelectedYear(item.category);
                }
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={!isMonthly && monthlyData[item.category] ? 'cursor-pointer' : 'cursor-default'}
            >
              {/* Barra */}
              <rect
                x={barX}
                y={barY}
                width={colWidth}
                height={barHeight}
                fill={isHovered ? '#2563eb' : '#3b82f6'}
                rx="4"
                className="transition-colors duration-200"
              />

              {/* Rótulo do valor no topo da coluna */}
              <text
                x={barX + colWidth / 2}
                y={barY - 6}
                textAnchor="middle"
                className="text-[10px] font-bold fill-gray-700 select-none"
              >
                {item.value}
              </text>

              {/* Rótulo do eixo X */}
              <text
                x={barX + colWidth / 2}
                y={padding.top + plotHeight + 18}
                textAnchor="middle"
                className="text-[11px] font-medium fill-gray-600 select-none"
              >
                {item.category}
              </text>

              {/* Badges de variação percentual intercoluna */}
              {item.variance && (
                <g transform={`translate(${barX + colWidth + (slotWidth - colWidth) / 2}, ${Math.min(barY, padding.top + 20)})`}>
                  {/* Linha vertical conectora fina */}
                  <line
                    x1="0"
                    y1="10"
                    x2="0"
                    y2={plotHeight - Math.min(barY, padding.top + 20) + padding.top}
                    stroke="#94a3b8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.4"
                  />
                  {/* Badge da variância */}
                  <rect
                    x="-34"
                    y="-16"
                    width="68"
                    height="18"
                    rx="4"
                    fill={item.variance.isPositive ? '#dcfce7' : '#fee2e2'}
                    stroke={item.variance.color}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="-4"
                    textAnchor="middle"
                    className="text-[9px] font-bold select-none"
                    fill={item.variance.color}
                  >
                    {item.variance.text}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {!isMonthly && (
        <span className="text-[10px] text-gray-400 mt-1">
          Dica: clique em uma coluna de ano para detalhar os meses
        </span>
      )}
    </div>
  );
};

export default YearlySeriesChart;
