'use client';

import { useMemo, useState } from 'react';

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
];

function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

const BurnUpChart = ({ chartData = [], selectedUsers = [] }) => {
  const [hoverIndex, setHoverIndex] = useState(null);

  const { sortedDates, userSeries, idealPoints, maxY } = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { sortedDates: [], userSeries: [], idealPoints: [], maxY: 170 };
    }

    const dateSet = new Set();
    const userMap = {};

    chartData.forEach(item => {
      const dateKey = item.date;
      dateSet.add(dateKey);

      if (!userMap[item.name]) {
        userMap[item.name] = {};
      }
      userMap[item.name][dateKey] = Number(item.totalHours) || 0;
    });

    const dates = Array.from(dateSet).sort();
    if (dates.length === 0) {
      return { sortedDates: [], userSeries: [], idealPoints: [], maxY: 170 };
    }

    // Filtra usuários selecionados ou todos
    const activeUserNames = (!selectedUsers || selectedUsers.length === 0)
      ? Object.keys(userMap)
      : selectedUsers.map(u => (typeof u === 'object' ? u.value : u)).filter(Boolean);

    let maxVal = 170;

    // Calcula linha ideal (0 a 170h distribuído linearmente)
    const ideal = dates.map((date, idx) => {
      const progress = dates.length > 1 ? idx / (dates.length - 1) : 1;
      const value = Math.round(170 * progress);
      return { date, value };
    });

    // Calcula acumulado por usuário
    const series = activeUserNames.map((name, colorIdx) => {
      const userHours = userMap[name] || {};
      let cumulative = 0;

      const points = dates.map(date => {
        const dayHours = userHours[date] || 0;
        cumulative += dayHours;
        return {
          date,
          value: cumulative,
          dayHours,
        };
      });

      if (cumulative > maxVal) maxVal = cumulative;

      return {
        name,
        color: COLORS[colorIdx % COLORS.length],
        points,
        totalCumulative: cumulative,
      };
    });

    return {
      sortedDates: dates,
      userSeries: series,
      idealPoints: ideal,
      maxY: Math.ceil(maxVal * 1.15),
    };
  }, [chartData, selectedUsers]);

  if (!chartData || chartData.length === 0 || sortedDates.length === 0) {
    return (
      <div className="w-full flex-grow min-h-[280px] flex items-center justify-center text-sm text-gray-400">
        Nenhum dado disponível para o gráfico Burn-Up.
      </div>
    );
  }

  const svgWidth = 850;
  const svgHeight = 360;
  const padding = { top: 30, right: 35, bottom: 50, left: 55 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const getX = (index) => {
    if (sortedDates.length <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (sortedDates.length - 1)) * plotWidth;
  };

  const getY = (val) => {
    return padding.top + plotHeight - (val / maxY) * plotHeight;
  };

  // Traçado da linha ideal
  let idealD = '';
  idealPoints.forEach((pt, idx) => {
    const x = getX(idx);
    const y = getY(pt.value);
    idealD += idx === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  });

  // Traçado das séries dos usuários
  const renderedSeries = userSeries.map(s => {
    let d = '';
    s.points.forEach((pt, idx) => {
      const x = getX(idx);
      const y = getY(pt.value);
      d += idx === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });
    return { ...s, d };
  });

  const activeDate = hoverIndex !== null ? sortedDates[hoverIndex] : null;
  const activeIdeal = hoverIndex !== null ? idealPoints[hoverIndex]?.value : null;

  return (
    <div className="w-full flex-grow min-h-[300px] relative flex flex-col items-center justify-center select-none">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-full overflow-visible"
        role="img"
        aria-label="Gráfico Burn-Up de Horas Trabalhadas"
      >
        <title>Burn-Up de Horas Trabalhadas (Meta 170h)</title>

        {/* Linhas de grade e valores no eixo Y */}
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
                {val}h
              </text>
            </g>
          );
        })}

        {/* Linha de destaque para os 170h */}
        {maxY >= 170 && (
          <g>
            <line
              x1={padding.left}
              y1={getY(170)}
              x2={padding.left + plotWidth}
              y2={getY(170)}
              stroke="#cbd5e1"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <text
              x={padding.left + plotWidth + 6}
              y={getY(170) + 3}
              textAnchor="start"
              className="text-[10px] font-bold fill-gray-500"
            >
              170h
            </text>
          </g>
        )}

        {/* Eixo X com datas */}
        {sortedDates.map((date, idx) => {
          const step = Math.max(1, Math.floor(sortedDates.length / 8));
          if (idx % step !== 0 && idx !== sortedDates.length - 1) return null;

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
                {formatDate(date)}
              </text>
            </g>
          );
        })}

        {/* Linha Ideal (0 a 170 horas) tracejada preta */}
        <path
          d={idealD}
          fill="none"
          stroke="#111827"
          strokeWidth="2.5"
          strokeDasharray="6 6"
        />

        {/* Bullets da Linha Ideal */}
        {idealPoints.map((pt, idx) => {
          const step = Math.max(1, Math.floor(idealPoints.length / 8));
          if (idx % step !== 0 && idx !== idealPoints.length - 1) return null;

          return (
            <circle
              key={idx}
              cx={getX(idx)}
              cy={getY(pt.value)}
              r="4"
              fill="#111827"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Séries contínuas acumuladas dos usuários */}
        {renderedSeries.map(s => (
          <g key={s.name}>
            <path
              d={s.d}
              fill="none"
              stroke={s.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {s.points.map((pt, idx) => {
              const step = Math.max(1, Math.floor(s.points.length / 10));
              if (idx % step !== 0 && idx !== s.points.length - 1) return null;

              return (
                <circle
                  key={idx}
                  cx={getX(idx)}
                  cy={getY(pt.value)}
                  r="4.5"
                  fill={s.color}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              );
            })}
          </g>
        ))}

        {/* Cursor Vertical Interativo */}
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
            {/* Ponto na linha ideal */}
            <circle
              cx={getX(hoverIndex)}
              cy={getY(activeIdeal)}
              r="5"
              fill="#111827"
              stroke="#ffffff"
              strokeWidth="2"
            />
            {/* Pontos nas séries dos usuários */}
            {renderedSeries.map(s => {
              const ptVal = s.points[hoverIndex]?.value || 0;
              return (
                <circle
                  key={s.name}
                  cx={getX(hoverIndex)}
                  cy={getY(ptVal)}
                  r="6"
                  fill={s.color}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="drop-shadow"
                />
              );
            })}
          </g>
        )}

        {/* Área invisível receptora de eventos */}
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
            const index = Math.round(relX * (sortedDates.length - 1));
            const clamped = Math.max(0, Math.min(sortedDates.length - 1, index));
            setHoverIndex(clamped);
          }}
          onMouseLeave={() => setHoverIndex(null)}
        />
      </svg>

      {/* Tooltip flutuante interativa */}
      {hoverIndex !== null && (
        <div className="absolute top-2 pointer-events-none bg-gray-900/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-xl text-xs space-y-1.5 z-10 min-w-[180px]">
          <div className="font-semibold border-b border-gray-700 pb-1 flex justify-between">
            <span>📅 {activeDate}</span>
            <span className="text-gray-300">Meta: {activeIdeal}h</span>
          </div>
          {renderedSeries.map(s => {
            const pt = s.points[hoverIndex];
            return (
              <div key={s.name} className="flex justify-between items-center text-xs">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span>{s.name}</span>
                </span>
                <span className="font-bold">{pt?.value || 0}h</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Legenda dos Desenvolvedores e Linha Ideal */}
      <div className="flex flex-wrap justify-center items-center gap-4 mt-2">
        <div className="flex items-center space-x-1.5 text-xs text-gray-700">
          <span className="w-4 h-0.5 border-b-2 border-dashed border-gray-900"></span>
          <span className="font-medium">Meta Ideal (0-170h)</span>
        </div>
        {renderedSeries.map(s => (
          <div key={s.name} className="flex items-center space-x-1.5 text-xs text-gray-700">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="font-medium">{s.name} ({s.totalCumulative}h)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BurnUpChart;
