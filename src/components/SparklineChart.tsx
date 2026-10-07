import React from 'react';

interface SparklineChartProps {
  data: number[];
  isPositive: boolean;
  height?: number;
  id: string;
  showBaseline?: boolean;
}

export const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  isPositive,
  height = 56,
  id,
  showBaseline = true
}) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 260;
  const padY = 6;
  const usableHeight = height - padY * 2;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = padY + usableHeight - ((val - min) / range) * usableHeight;
    return { x, y };
  });

  const linePath = points
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');

  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;
  const baselineY = points[0].y;
  const strokeColor = isPositive ? '#089981' : '#F23645';
  const gradientId = `spark-grad-${id.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full overflow-visible block"
      style={{ height: `${height}px` }}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.22" />
          <stop offset="85%" stopColor={strokeColor} stopOpacity="0.02" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {showBaseline && (
        <line
          x1="0"
          y1={baselineY}
          x2={width}
          y2={baselineY}
          stroke="#C3C5D8"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
      )}

      <path d={areaPath} fill={`url(#${gradientId})`} />

      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Terminal current price dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="2.5"
        fill={strokeColor}
      />
    </svg>
  );
};
