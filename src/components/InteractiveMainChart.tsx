import React, { useState } from 'react';

interface InteractiveMainChartProps {
  series: { time: string; value: number; volume: number }[];
  isPositive: boolean;
  prevClose: number;
  currency: string;
  symbol: string;
}

export const InteractiveMainChart: React.FC<InteractiveMainChartProps> = ({
  series,
  isPositive,
  prevClose,
  currency,
  symbol,
}) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (!series || series.length < 2) return null;

  const values = series.map((d) => d.value);
  const allValues = [...values, prevClose];
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = (maxVal - minVal) || 1;

  const width = 820;
  const height = 270;
  const padTop = 20;
  const padBottom = 32;
  const padRight = 64;
  const chartW = width - padRight;
  const chartH = height - padTop - padBottom;

  const getX = (index: number) => (index / (series.length - 1)) * chartW;
  const getY = (val: number) =>
    padTop + chartH - ((val - minVal) / range) * chartH;

  const points = series.map((d, idx) => ({
    x: getX(idx),
    y: getY(d.value),
    ...d,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const areaPath = `${linePath} L ${chartW} ${padTop + chartH} L 0 ${padTop + chartH} Z`;

  const prevCloseY = getY(prevClose);
  const strokeColor = isPositive ? '#089981' : '#F23645';
  const activePoint = hoverIndex !== null ? points[hoverIndex] : points[points.length - 1];

  // Y-axis ticks (4 levels)
  const yTicks = [0, 0.33, 0.66, 1].map((t) => {
    const val = minVal + t * range;
    return {
      value: val,
      y: getY(val),
    };
  });

  // X-axis labels (every ~4 points)
  const step = Math.max(1, Math.floor(series.length / 6));
  const xTicks = points.filter((_, idx) => idx % step === 0 || idx === points.length - 1);

  return (
    <div className="relative select-none">
      {/* Crosshair Readout Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-2 border-b border-[#E0E3EB] text-[12px] text-[#787B86]">
        <div className="flex items-center gap-4 tabular-nums">
          <span>
            <strong className="text-[#131722] font-semibold">{symbol}</strong> · {activePoint.time}
          </span>
          <span>
            Last: <strong className="text-[#131722] font-semibold">{activePoint.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</strong>
          </span>
          <span>
            Prev Close: <strong className="text-[#131722] font-medium">{prevClose.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </span>
          <span className="hidden sm:inline">
            Vol: <strong className="text-[#131722] font-medium">{activePoint.volume}M</strong>
          </span>
        </div>
        <div className="text-[11px] text-[#787B86] tabular-nums">
          Range: {minVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} – {maxVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-[250px] sm:h-[280px] block overflow-visible cursor-crosshair"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="main-chart-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.20" />
              <stop offset="85%" stopColor={strokeColor} stopOpacity="0.02" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines & Right Axis Labels */}
          {yTicks.map((tick, idx) => (
            <g key={idx}>
              <line
                x1="0"
                y1={tick.y}
                x2={chartW}
                y2={tick.y}
                stroke="#F0F3FA"
                strokeWidth="1"
              />
              <text
                x={chartW + 8}
                y={tick.y + 4}
                fill="#787B86"
                fontSize="11"
                fontWeight="500"
                className="tabular-nums"
              >
                {tick.value.toLocaleString('en-US', {
                  minimumFractionDigits: tick.value > 1000 ? 0 : 2,
                  maximumFractionDigits: tick.value > 1000 ? 0 : 2,
                })}
              </text>
            </g>
          ))}

          {/* Previous Close Dotted Reference Line */}
          <line
            x1="0"
            y1={prevCloseY}
            x2={chartW}
            y2={prevCloseY}
            stroke="#787B86"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Volume Bars at bottom */}
          {points.map((pt, idx) => {
            const barH = (pt.volume / 320) * 36;
            const barW = Math.max(2, chartW / points.length - 3);
            return (
              <rect
                key={`vol-${idx}`}
                x={pt.x - barW / 2}
                y={padTop + chartH - barH}
                width={barW}
                height={barH}
                fill={hoverIndex === idx ? '#2962FF' : '#E0E3EB'}
                opacity={hoverIndex === idx ? 0.55 : 0.45}
                rx="1"
              />
            );
          })}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#main-chart-grad)" />

          {/* Main Trend Line */}
          <path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover Crosshair Vertical Line */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={activePoint.x}
                y1={padTop}
                x2={activePoint.x}
                y2={padTop + chartH}
                stroke="#2962FF"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <line
                x1="0"
                y1={activePoint.y}
                x2={chartW}
                y2={activePoint.y}
                stroke="#2962FF"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.5"
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r="4.5"
                fill="#FFFFFF"
                stroke={strokeColor}
                strokeWidth="2.5"
              />
            </g>
          )}

          {/* X-axis Timestamps */}
          {xTicks.map((pt, idx) => (
            <text
              key={`x-${idx}`}
              x={pt.x}
              y={height - 8}
              textAnchor={pt.x === 0 ? 'start' : pt.x >= chartW - 10 ? 'end' : 'middle'}
              fill="#787B86"
              fontSize="11"
              fontWeight="500"
              className="tabular-nums"
            >
              {pt.time}
            </text>
          ))}

          {/* Invisible Interactive Hit Columns */}
          {points.map((pt, idx) => {
            const colW = chartW / points.length;
            return (
              <rect
                key={`hit-${idx}`}
                x={pt.x - colW / 2}
                y={0}
                width={colW}
                height={height}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(idx)}
                onClick={() => setHoverIndex(idx)}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};
