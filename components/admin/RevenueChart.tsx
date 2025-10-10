import React from 'react';

// Mock data for the last 6 months
const chartData = [
  { month: 'فبراير', revenue: 1200 },
  { month: 'مارس', revenue: 1800 },
  { month: 'أبريل', revenue: 1500 },
  { month: 'مايو', revenue: 2200 },
  { month: 'يونيو', revenue: 2500 },
  { month: 'يوليو', revenue: 3100 },
];

const RevenueChart: React.FC = () => {
  const chartWidth = 500;
  const chartHeight = 200;
  const padding = 30;

  const maxX = chartWidth - padding;
  const maxY = chartHeight - padding;

  const maxRevenue = Math.max(...chartData.map(d => d.revenue));
  
  const getX = (index: number) => padding + (index / (chartData.length - 1)) * (maxX - padding);
  const getY = (revenue: number) => maxY - (revenue / maxRevenue) * (maxY - padding);

  const linePath = chartData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.revenue)}`)
    .join(' ');

  const areaPath = `${linePath} L ${getX(chartData.length - 1)} ${maxY} L ${getX(0)} ${maxY} Z`;

  return (
    <div className="w-full h-64">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
        {/* Y-axis labels and grid lines */}
        {[0, 0.5, 1].map(tick => (
          <g key={tick} className="text-xs text-[var(--text-secondary)]">
            <text x="5" y={getY(maxRevenue * tick) + 4} fill="currentColor">
              {Math.round(maxRevenue * (1 - tick))}
            </text>
            <line
              x1={padding}
              y1={getY(maxRevenue * tick)}
              x2={maxX}
              y2={getY(maxRevenue * tick)}
              stroke="var(--border-primary)"
              strokeWidth="1"
              strokeDasharray="3"
            />
          </g>
        ))}

        {/* X-axis labels */}
        {chartData.map((d, i) => (
          <text key={d.month} x={getX(i)} y={chartHeight - 5} textAnchor="middle" fill="var(--text-secondary)" className="text-xs">
            {d.month}
          </text>
        ))}

        {/* Gradient for area fill */}
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill path */}
        <path d={areaPath} fill="url(#areaGradient)" />

        {/* Line path */}
        <path
          d={linePath}
          fill="none"
          stroke="#a855f7"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {chartData.map((d, i) => (
          <circle
            key={i}
            cx={getX(i)}
            cy={getY(d.revenue)}
            r="5"
            fill="var(--bg-secondary)"
            stroke="#a855f7"
            strokeWidth="2"
          />
        ))}
      </svg>
    </div>
  );
};

export default RevenueChart;