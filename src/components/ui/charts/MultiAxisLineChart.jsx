'use client';

import { useId, useMemo, useState } from 'react';

const PALETTE = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#06b6d4', // cyan
];

function formatDate(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

const MultiAxisLineChart = ({
  chartId,
  height = '300px',
  seriesConfigs = [],
  useSharedYAxis = false,
}) => {
  const generatedId = useId();
  const id = chartId || `multiaxis-${generatedId}`;

  const [hiddenSeries, setHiddenSeries] = useState({});
  const [hoverIndex, setHoverIndex] = useState(null);

  const toggleSeries = (name) => {
    setHiddenSeries(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // Coleta de todas as datas únicas ordenadas
  const { allDates, processedSeries, leftMaxY, rightMaxY } = useMemo(() => {
    const dateSet = new Set();
    const seriesList = (seriesConfigs || []).map((config, index) => {
      const name = config.name || `Série ${index + 1}`;
      const color = PALETTE[index % PALETTE.length];
      const dataMap = new Map();

      (config.data || []).forEach(item => {
        const rawDate = item.date;
        const timeKey = new Date(rawDate).getTime();
        if (!isNaN(timeKey)) {
          dateSet.add(timeKey);
          dataMap.set(timeKey, Number(item.value) || 0);
        }
      });

      return {
        name,
        color,
        opposite: Boolean(config.opposite),
        dataMap,
      };
    });

    const sortedDates = Array.from(dateSet).sort((a, b) => a - b);

    // Determina limites dos eixos
    let lMax = 10;
    let rMax = 10;

    seriesList.forEach(s => {
      s.dataMap.forEach(val => {
        if (useSharedYAxis || !s.opposite) {
          if (val > lMax) lMax = val;
        } else {
          if (val > rMax) rMax = val;
        }
      });
    });

    return {
      allDates: sortedDates,
      processedSeries: seriesList,
      leftMaxY: Math.ceil(lMax * 1.15),
      rightMaxY: Math.ceil(rMax * 1.15),
    };
  }, [seriesConfigs, useSharedYAxis]);

  if (!seriesConfigs || seriesConfigs.length === 0 || allDates.length === 0) {
    return (
      <div id={id} style={{ width: '100%', height }} className="flex items-center justify-center text-sm text-gray-400">
        Nenhum dado disponível para o gráfico
      </div>
    );
  }

  const svgWidth = 800;
  const svgHeight = 320;
  const hasRightAxis = !useSharedYAxis && processedSeries.some(s => s.opposite);
  const padding = {
    top: 30,
    right: hasRightAxis ? 55 : 30,
    bottom: 60,
    left: 55,
  };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const getX = (timeIndex) => {
    if (allDates.length <= 1) return padding.left + plotWidth / 2;
    return padding.left + (timeIndex / (allDates.length - 1)) * plotWidth;
  };

  const getY = (value, isOpposite) => {
    const max = (!useSharedYAxis && isOpposite) ? rightMaxY : leftMaxY;
    return padding.top + plotHeight - (value / max) * plotHeight;
  };

  // Gerar caminhos de linha para cada série
  const paths = processedSeries.map(s => {
    const isHidden = hiddenSeries[s.name];
    if (isHidden) return null;

    let d = '';
    allDates.forEach((dateTime, idx) => {
      const val = s.dataMap.has(dateTime) ? s.dataMap.get(dateTime) : 0;
      const x = getX(idx);
      const y = getY(val, s.opposite);
      if (idx === 0) {
        d += `M ${x.toFixed(1)} ${y.toFixed(1)}`;
      } else {
        d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
    });

    return {
      ...s,
      d,
    };
  }).filter(Boolean);

  const hoverDateTime = hoverIndex !== null ? allDates[hoverIndex] : null;

  return (
    <div id={id} style={{ width: '100%', height }} className="relative flex flex-col items-center justify-center select-none">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full overflow-visible"
        role="img"
        aria-label="Gráfico de Linhas Multieixo"
      >
        <title>Gráfico de Linhas Multieixo</title>

        {/* Linhas de grade horizontais */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = padding.top + plotHeight * (1 - pct);
          const leftVal = Math.round(leftMaxY * pct);
          const rightVal = Math.round(rightMaxY * pct);

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
              {/* Ticks do eixo esquerdo */}
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] fill-gray-400 font-mono"
              >
                {leftVal}
              </text>
              {/* Ticks do eixo direito */}
              {hasRightAxis && (
                <text
                  x={padding.left + plotWidth + 10}
                  y={y + 4}
                  textAnchor="start"
                  className="text-[10px] fill-gray-400 font-mono"
                >
                  {rightVal}
                </text>
              )}
            </g>
          );
        })}

        {/* Linhas de grade e rótulos do eixo X */}
        {allDates.map((dateTime, idx) => {
          // Exibe rótulos com espaçamento razoável
          const step = Math.max(1, Math.floor(allDates.length / 6));
          if (idx % step !== 0 && idx !== allDates.length - 1) return null;

          const x = getX(idx);
          return (
            <g key={idx}>
              <line
                x1={x}
                y1={padding.top}
                x2={x}
                y2={padding.top + plotHeight}
                stroke="#f8fafc"
                strokeWidth="1"
              />
              <text
                x={x}
                y={padding.top + plotHeight + 18}
                textAnchor="middle"
                className="text-[10px] fill-gray-500"
              >
                {formatDate(dateTime)}
              </text>
            </g>
          );
        })}

        {/* Séries de linhas */}
        {paths.map(s => (
          <path
            key={s.name}
            d={s.d}
            fill="none"
            stroke={s.color}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Linha vertical e marcadores de cursor Crosshair */}
        {hoverIndex !== null && (
          <g>
            <line
              x1={getX(hoverIndex)}
              y1={padding.top}
              x2={getX(hoverIndex)}
              y2={padding.top + plotHeight}
              stroke="#94a3b8"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {paths.map(s => {
              const val = s.dataMap.has(hoverDateTime) ? s.dataMap.get(hoverDateTime) : 0;
              const cx = getX(hoverIndex);
              const cy = getY(val, s.opposite);

              return (
                <circle
                  key={s.name}
                  cx={cx}
                  cy={cy}
                  r="5"
                  fill={s.color}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="drop-shadow"
                />
              );
            })}
          </g>
        )}

        {/* Área invisível sensível a eventos do mouse */}
        <rect
          x={padding.left}
          y={padding.top}
          width={plotWidth}
          height={plotHeight}
          fill="transparent"
          className="cursor-crosshair"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = (e.clientX - rect.left) / rect.width;
            const index = Math.round(relX * (allDates.length - 1));
            const clamped = Math.max(0, Math.min(allDates.length - 1, index));
            setHoverIndex(clamped);
          }}
          onMouseLeave={() => setHoverIndex(null)}
        />
      </svg>

      {/* Tooltip flutuante quando hover ativo */}
      {hoverIndex !== null && (
        <div
          className="absolute top-2 pointer-events-none bg-gray-900/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-md shadow-lg text-xs space-y-1 z-10"
        >
          <div className="font-semibold border-b border-gray-700 pb-0.5">
            📅 {new Date(hoverDateTime).toLocaleDateString('pt-BR')}
          </div>
          {processedSeries.filter(s => !hiddenSeries[s.name]).map(s => {
            const val = s.dataMap.has(hoverDateTime) ? s.dataMap.get(hoverDateTime) : 0;
            return (
              <div key={s.name} className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span>{s.name}:</span>
                <span className="font-bold">{val}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Legenda interativa no rodapé */}
      <div className="flex flex-wrap justify-center items-center gap-4 mt-2">
        {processedSeries.map(s => {
          const isHidden = hiddenSeries[s.name];
          return (
            <button
              key={s.name}
              onClick={() => toggleSeries(s.name)}
              className={`flex items-center space-x-1.5 text-xs px-2 py-0.5 rounded transition-all ${
                isHidden ? 'opacity-40 line-through text-gray-400' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="w-3 h-1 rounded" style={{ backgroundColor: s.color }} />
              <span className="font-medium">{s.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MultiAxisLineChart;
