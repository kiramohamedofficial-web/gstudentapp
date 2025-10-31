import React from 'react';

interface ChartDataPoint {
  month: string;
  revenue: number;
}

interface RevenueChartProps {
  data: ChartDataPoint[];
}


const RevenueChart: React.FC<RevenueChartProps> = ({ data: chartData }) => {
  if (!chartData || chartData.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-center text-[var(--text-secondary)]">
        <div className="text-center">
          <p>لا توجد بيانات إيرادات لعرضها.</p>
          <p className="text-xs">سيظهر الرسم البياني هنا عند وجود اشتراكات.</p>
        </div>
      </div>
    );
  }

  const chartWidth = 500;
  const chartHeight = 200;
  const paddingY = 30;
  const paddingX = 10;

  const maxX = chartWidth - paddingX;
  const maxY = chartHeight - paddingY;

  const maxRevenue = Math.max(...chartData.map(d => d.revenue)) * 1.1; // Add 10% buffer
  
  const getX = (index: number) => paddingX + (index / (chartData.length - 1)) * (maxX - paddingX);
  const getY = (revenue: number) => maxY - (revenue / maxRevenue) * (maxY - paddingY);

  const linePath = chartData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.revenue)}`)
    .join(' ');

  const areaPath = `${linePath} L ${getX(chartData.length - 1)} ${maxY} L ${getX(0)} ${maxY} Z`;

  return (
    <div className="w-full h-64">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
        {/* Y-axis labels and grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(tick => {
          const y = getY(maxRevenue * tick);
          if (y > maxY) return null;
          return (
            <g key={tick} className="text-xs text-[var(--text-secondary)]">
              <text x="5" y={y + 4} fill="currentColor" style={{ direction: 'ltr' }}>
                {Math.round(maxRevenue * (1-tick))}
              </text>
              <line x1={paddingX + 20} y1={y} x2={maxX} y2={y} stroke="var(--border-primary)" strokeWidth="1" strokeDasharray="3, 5" />
            </g>
          )
        })}

        {/* X-axis labels */}
        {chartData.map((d, i) => (
          <text key={d.month} x={getX(i)} y={chartHeight - 5} textAnchor="middle" fill="var(--text-secondary)" className="text-xs">
            {d.month}
          </text>
        ))}

        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
          </linearGradient>
           <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>

        <path d={areaPath} fill="url(#areaGradient)" />

        <path d={linePath} fill="none" stroke="url(#lineGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {chartData.map((d, i) => (
            <g key={i}>
                <circle cx={getX(i)} cy={getY(d.revenue)} r="8" fill="#a855f7" fillOpacity="0.2" />
                <circle cx={getX(i)} cy={getY(d.revenue)} r="4" fill="var(--bg-secondary)" stroke="url(#lineGradient)" strokeWidth="2" />
            </g>
        ))}
      </svg>
    </div>
  );
};

export default RevenueChart;