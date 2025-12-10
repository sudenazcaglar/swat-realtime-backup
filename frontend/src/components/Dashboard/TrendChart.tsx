import React from 'react';
import { SensorData } from '../../types';

interface TrendChartProps {
  title: string;
  sensors: SensorData[];
  showThreshold?: boolean;
  thresholdValue?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({ 
  title, 
  sensors, 
  showThreshold = false, 
  thresholdValue = 0.8 
}) => {
  const chartRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 800, height: 400 });

  React.useEffect(() => {
    const updateDimensions = () => {
      if (chartRef.current) {
        const rect = chartRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(600, rect.width - 48), // Account for card padding
          height: Math.max(300, rect.height - 120) // Account for title and legend
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const padding = { top: 20, right: 60, bottom: 60, left: 60 };
  const innerWidth = dimensions.width - padding.left - padding.right;
  const innerHeight = dimensions.height - padding.top - padding.bottom;

  const colors = ['#06B6D4', '#F97316', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

  // Calculate scales
  const allValues = sensors.flatMap(sensor => sensor.trend);
  if (showThreshold && thresholdValue) allValues.push(thresholdValue);
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(...allValues, 0);
  const range = maxValue - minValue || 1;

  // Generate time labels
  const generateTimeLabels = (count: number) => {
    const now = new Date();
    return Array.from({ length: count }, (_, i) => {
      const time = new Date(now.getTime() - (count - 1 - i) * 2000);
      return time.toLocaleTimeString('en-US', { 
        hour12: false, 
        minute: '2-digit', 
        second: '2-digit' 
      });
    });
  };

  const timeLabels = generateTimeLabels(sensors[0]?.trend.length || 20);

  // Create smooth spline path
  const createSmoothPath = (data: number[]) => {
    if (data.length < 2) return '';

    const points = data.map((value, index) => ({
      x: padding.left + (index / (data.length - 1)) * innerWidth,
      y: padding.top + (1 - (value - minValue) / range) * innerHeight
    }));

    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      const cp1x = prev.x + (curr.x - prev.x) * 0.4;
      const cp1y = prev.y;
      const cp2x = curr.x - (next ? (next.x - curr.x) * 0.4 : 0);
      const cp2y = curr.y;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }
    
    return path;
  };

  const getThresholdY = () => {
    if (!showThreshold || !thresholdValue) return 0;
    return padding.top + (1 - (thresholdValue - minValue) / range) * innerHeight;
  };

  // Y-axis ticks
  const yTicks = Array.from({ length: 6 }, (_, i) => {
    const value = minValue + (range * i / 5);
    return {
      value,
      y: padding.top + (1 - (value - minValue) / range) * innerHeight
    };
  });

  // X-axis ticks: sabit maksimum etiket sayısı (örneğin 12)
  const MAX_X_TICKS = 12;
  const labelCount = timeLabels.length;
  const xTickCount = Math.min(MAX_X_TICKS, labelCount);

  const xTickStep =
    xTickCount > 1 ? (labelCount - 1) / (xTickCount - 1) : 1;

  const xTickIndices = Array.from(
    { length: xTickCount },
    (_, i) => Math.round(i * xTickStep)
  );

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 h-full flex flex-col">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      
      <div ref={chartRef} className="flex-1 relative bg-gray-900 rounded-lg p-4">
        <svg width={dimensions.width} height={dimensions.height} className="w-full h-full">
          {/* Definitions */}
          <defs>
            <pattern id={`grid-${title.replace(/\s+/g, '-')}`} width="40" height="30" patternUnits="userSpaceOnUse">
              <path 
                d="M 40 0 L 0 0 0 30" 
                fill="none" 
                stroke="#374151" 
                strokeWidth="1" 
                opacity="0.2"
              />
            </pattern>
            
            <filter id={`glow-${title.replace(/\s+/g, '-')}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Grid background */}
          <rect 
            x={padding.left} 
            y={padding.top} 
            width={innerWidth} 
            height={innerHeight} 
            fill={`url(#grid-${title.replace(/\s+/g, '-')})`} 
          />
          
          {/* Axes */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + innerHeight}
            stroke="#6B7280"
            strokeWidth="2"
          />
          
          <line
            x1={padding.left}
            y1={padding.top + innerHeight}
            x2={padding.left + innerWidth}
            y2={padding.top + innerHeight}
            stroke="#6B7280"
            strokeWidth="2"
          />
          
          {/* Y-axis labels and grid lines */}
          {yTicks.map((tick, index) => (
            <g key={index}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={padding.left + innerWidth}
                y2={tick.y}
                stroke="#374151"
                strokeWidth="1"
                opacity="0.3"
              />
              <text
                x={padding.left - 10}
                y={tick.y + 4}
                textAnchor="end"
                fill="#9CA3AF"
                fontSize="11"
              >
                {tick.value.toFixed(1)}
              </text>
            </g>
          ))}
          
          {/* X-axis labels */}
          {xTickIndices.map((index) => {
            if (index >= timeLabels.length) return null;
            const x = padding.left + (index / (timeLabels.length - 1 || 1)) * innerWidth;
            return (
              <text
                key={index}
                x={x}
                y={padding.top + innerHeight + 20}
                textAnchor="middle"
                fill="#9CA3AF"
                fontSize="10"
              >
                {timeLabels[index]}
              </text>
            );
          })}
          
          {/* Axis labels */}
          <text
            x={padding.left + innerWidth / 2}
            y={dimensions.height - 10}
            textAnchor="middle"
            fill="#9CA3AF"
            fontSize="12"
            fontWeight="500"
          >
            Time
          </text>
          
          <text
            x={15}
            y={padding.top + innerHeight / 2}
            textAnchor="middle"
            fill="#9CA3AF"
            fontSize="12"
            fontWeight="500"
            transform={`rotate(-90 15 ${padding.top + innerHeight / 2})`}
          >
            Value
          </text>
          
          {/* Threshold line */}
          {showThreshold && (
            <>
              <line
                x1={padding.left}
                y1={getThresholdY()}
                x2={padding.left + innerWidth}
                y2={getThresholdY()}
                stroke="#EF4444"
                strokeWidth="2"
                strokeDasharray="8,4"
                opacity="0.9"
              />
              <text
                x={padding.left + innerWidth + 10}
                y={getThresholdY() + 4}
                fill="#EF4444"
                fontSize="11"
                fontWeight="bold"
              >
                {(thresholdValue * 100).toFixed(0)}%
              </text>
            </>
          )}
          
          {/* Data lines */}
          {sensors.map((sensor, index) => {
            const color = colors[index % colors.length];
            const path = createSmoothPath(sensor.trend);
            
            return (
              <g key={sensor.id}>
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth="3"
                  filter={`url(#glow-${title.replace(/\s+/g, '-')})`}
                  className="transition-all duration-300"
                />
                
                {/* Data points */}
                {sensor.trend.map((value, pointIndex) => {
                  const x = padding.left + (pointIndex / (sensor.trend.length - 1 || 1)) * innerWidth;
                  const y = padding.top + (1 - (value - minValue) / range) * innerHeight;
                  
                  return (
                    <circle
                      key={pointIndex}
                      cx={x}
                      cy={y}
                      r="4"
                      fill={color}
                      stroke="#1F2937"
                      strokeWidth="2"
                      className="opacity-0 hover:opacity-100 transition-opacity duration-200"
                    >
                      <title>{`${sensor.name}: ${value.toFixed(2)} ${sensor.unit}`}</title>
                    </circle>
                  );
                })}
                
                {/* Latest value indicator */}
                {sensor.trend.length > 0 && (
                  <g>
                    <circle
                      cx={padding.left + innerWidth}
                      cy={padding.top + (1 - (sensor.value - minValue) / range) * innerHeight}
                      r="5"
                      fill={color}
                      stroke="#1F2937"
                      strokeWidth="2"
                      className="animate-pulse"
                    />
                    
                    <g transform={`translate(${padding.left + innerWidth + 15}, ${padding.top + (1 - (sensor.value - minValue) / range) * innerHeight - 10})`}>
                      <rect
                        x="-25"
                        y="-12"
                        width="50"
                        height="24"
                        fill="#1F2937"
                        stroke={color}
                        strokeWidth="1"
                        rx="4"
                        opacity="0.95"
                      />
                      <text
                        x="0"
                        y="4"
                        textAnchor="middle"
                        fill={color}
                        fontSize="11"
                        fontWeight="bold"
                      >
                        {sensor.value.toFixed(1)}
                      </text>
                    </g>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4">
        {sensors.map((sensor, index) => (
          <div key={sensor.id} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-sm text-gray-300">{sensor.name}</span>
          </div>
        ))}
        {showThreshold && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-red-500 border-dashed" style={{ borderTop: '2px dashed #EF4444' }} />
            <span className="text-sm text-gray-300">Threshold</span>
          </div>
        )}
      </div>
    </div>
  );
};
