import React, { useEffect, useRef } from 'react';
import { SensorData } from '../../types';

interface AnomalyChartProps {
  sensor: SensorData;
  thresholdValue?: number;
}

export const AnomalyChart: React.FC<AnomalyChartProps> = ({ 
  sensor, 
  thresholdValue = 0.8 
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 1000, height: 500 });
  
  React.useEffect(() => {
    const updateDimensions = () => {
      if (chartRef.current) {
        const rect = chartRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(800, rect.width - 48), // Account for card padding
          height: Math.max(400, rect.height - 120) // Account for title and status
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const padding = { top: 40, right: 80, bottom: 60, left: 80 };
  const innerWidth = dimensions.width - padding.left - padding.right;
  const innerHeight = dimensions.height - padding.top - padding.bottom;

  // Generate time labels for x-axis
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

  const timeLabels = generateTimeLabels(sensor.trend.length);

  // Create smooth curve path
  const createSmoothPath = (data: number[]) => {
    if (data.length < 2) return '';

    const points = data.map((value, index) => ({
      x: padding.left + (index / (data.length - 1)) * innerWidth,
      y: padding.top + (1 - value) * innerHeight
    }));

    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      // Calculate control points for smooth curve
      const cp1x = prev.x + (curr.x - prev.x) * 0.3;
      const cp1y = prev.y;
      const cp2x = curr.x - (next ? (next.x - curr.x) * 0.3 : 0);
      const cp2y = curr.y;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }
    
    return path;
  };

  const thresholdY = padding.top + (1 - thresholdValue) * innerHeight;
  const latestValue = sensor.value;
  const latestX = padding.left + innerWidth;
  const latestY = padding.top + (1 - latestValue) * innerHeight;

  // Y-axis ticks
  const yTicks = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
  
  // X-axis ticks (show every 5th time label)
  const xTickIndices = Array.from({ length: Math.ceil(timeLabels.length / 5) }, (_, i) => i * 5);

  useEffect(() => {
    // Animate path drawing
    if (pathRef.current) {
      const path = pathRef.current;
      const length = path.getTotalLength();
      
      path.style.strokeDasharray = `${length}`;
      path.style.strokeDashoffset = `${length}`;
      
      // Animate the path
      path.animate([
        { strokeDashoffset: length },
        { strokeDashoffset: 0 }
      ], {
        duration: 1000,
        easing: 'ease-out',
        fill: 'forwards'
      });
    }
  }, [sensor.trend]);

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-2xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Anomaly Detection Monitor</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-cyan-400 rounded shadow-lg shadow-cyan-400/50" />
            <span className="text-sm text-gray-300">Anomaly Score</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-0.5 bg-red-500 border-dashed" style={{ borderTop: '2px dashed #EF4444' }} />
            <span className="text-sm text-gray-300">Threshold</span>
          </div>
        </div>
      </div>
      
      <div ref={chartRef} className="flex-1 relative bg-gray-900 rounded-lg p-4">
        <svg 
          ref={svgRef}
          width={dimensions.width} 
          height={dimensions.height} 
          className="w-full h-full"
          style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.1))' }}
        >
          {/* Grid lines */}
          <defs>
            <pattern id="anomaly-grid" width="40" height="30" patternUnits="userSpaceOnUse">
              <path 
                d="M 40 0 L 0 0 0 30" 
                fill="none" 
                stroke="#374151" 
                strokeWidth="1" 
                opacity="0.2"
              />
            </pattern>
            
            {/* Glow filter for anomaly line */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <rect 
            x={padding.left} 
            y={padding.top} 
            width={innerWidth} 
            height={innerHeight} 
            fill="url(#anomaly-grid)" 
          />
          
          {/* Y-axis */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + innerHeight}
            stroke="#6B7280"
            strokeWidth="2"
          />
          
          {/* X-axis */}
          <line
            x1={padding.left}
            y1={padding.top + innerHeight}
            x2={padding.left + innerWidth}
            y2={padding.top + innerHeight}
            stroke="#6B7280"
            strokeWidth="2"
          />
          
          {/* Y-axis labels and grid lines */}
          {yTicks.map((tick) => {
            const y = padding.top + (1 - tick) * innerHeight;
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={padding.left + innerWidth}
                  y2={y}
                  stroke="#374151"
                  strokeWidth="1"
                  opacity="0.3"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fill="#9CA3AF"
                  fontSize="12"
                >
                  {(tick * 100).toFixed(0)}%
                </text>
              </g>
            );
          })}
          
          {/* X-axis labels */}
          {xTickIndices.map((index) => {
            if (index >= timeLabels.length) return null;
            const x = padding.left + (index / (timeLabels.length - 1)) * innerWidth;
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
            Anomaly Score
          </text>
          
          {/* Threshold line */}
          <line
            x1={padding.left}
            y1={thresholdY}
            x2={padding.left + innerWidth}
            y2={thresholdY}
            stroke="#EF4444"
            strokeWidth="2"
            strokeDasharray="8,4"
            opacity="0.9"
          />
          
          {/* Threshold label */}
          <text
            x={padding.left + innerWidth + 10}
            y={thresholdY + 4}
            fill="#EF4444"
            fontSize="12"
            fontWeight="bold"
          >
            {(thresholdValue * 100).toFixed(0)}%
          </text>
          
          {/* Anomaly score line with glow effect */}
          <path
            ref={pathRef}
            d={createSmoothPath(sensor.trend)}
            fill="none"
            stroke="#06B6D4"
            strokeWidth="3"
            filter="url(#glow)"
            className="transition-all duration-300"
          />
          
          {/* Data points with tooltips */}
          {sensor.trend.map((value, index) => {
            const x = padding.left + (index / (sensor.trend.length - 1)) * innerWidth;
            const y = padding.top + (1 - value) * innerHeight;
            
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill="#06B6D4"
                stroke="#1F2937"
                strokeWidth="2"
                className="opacity-0 hover:opacity-100 transition-opacity duration-200"
              >
                <title>{`Anomaly Score: ${(value * 100).toFixed(1)}%`}</title>
              </circle>
            );
          })}
          
          {/* Latest value indicator */}
          <g>
            <circle
              cx={latestX}
              cy={latestY}
              r="6"
              fill="#06B6D4"
              stroke="#1F2937"
              strokeWidth="2"
              className="animate-pulse"
            />
            
            {/* Floating value label */}
            <g transform={`translate(${latestX + 15}, ${latestY - 10})`}>
              <rect
                x="-20"
                y="-12"
                width="40"
                height="24"
                fill="#1F2937"
                stroke="#06B6D4"
                strokeWidth="1"
                rx="4"
                opacity="0.95"
              />
              <text
                x="0"
                y="4"
                textAnchor="middle"
                fill="#06B6D4"
                fontSize="12"
                fontWeight="bold"
              >
                {(latestValue * 100).toFixed(1)}%
              </text>
            </g>
          </g>
          
          {/* Critical zone highlighting */}
          {latestValue > thresholdValue && (
            <rect
              x={padding.left}
              y={padding.top}
              width={innerWidth}
              height={(1 - thresholdValue) * innerHeight}
              fill="#EF4444"
              opacity="0.1"
            />
          )}
        </svg>
        
        {/* Status indicator */}
        <div className="absolute top-4 right-4">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
            latestValue > thresholdValue 
              ? 'bg-red-500/20 border border-red-500' 
              : latestValue > thresholdValue * 0.8
              ? 'bg-orange-500/20 border border-orange-500'
              : 'bg-green-500/20 border border-green-500'
          }`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              latestValue > thresholdValue 
                ? 'bg-red-500' 
                : latestValue > thresholdValue * 0.8
                ? 'bg-orange-500'
                : 'bg-green-500'
            }`} />
            <span className={`text-sm font-medium ${
              latestValue > thresholdValue 
                ? 'text-red-400' 
                : latestValue > thresholdValue * 0.8
                ? 'text-orange-400'
                : 'text-green-400'
            }`}>
              {latestValue > thresholdValue 
                ? 'ANOMALY DETECTED' 
                : latestValue > thresholdValue * 0.8
                ? 'WARNING'
                : 'NORMAL'
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};