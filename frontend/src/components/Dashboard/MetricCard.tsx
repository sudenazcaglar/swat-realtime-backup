import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { SensorData } from '../../types';

interface MetricCardProps {
  sensor: SensorData;
}

export const MetricCard: React.FC<MetricCardProps> = ({ sensor }) => {
  const getTrendIcon = () => {
    const recent = sensor.trend.slice(-5);
    const average = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const current = sensor.value;
    
    if (current > average * 1.05) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (current < average * 0.95) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getStatusColor = () => {
    switch (sensor.status) {
      case 'critical': return 'border-red-500 bg-red-500/10 shadow-lg shadow-red-500/20';
      case 'warning': return 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/20';
      default: return 'border-gray-600 bg-gray-800/50 hover:border-cyan-500/50';
    }
  };

  const formatValue = (value: number) => {
    if (sensor.id === 'anomaly') {
      return (value * 100).toFixed(1) + '%';
    }
    return value.toFixed(1);
  };

  // Create smooth sparkline path
  const createSparklinePath = (data: number[]) => {
    if (data.length < 2) return '';
    
    const width = 120;
    const height = 60;
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;
    
    const points = data.map((value, index) => ({
      x: (index / (data.length - 1)) * width,
      y: height - ((value - minValue) / range) * height
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

  const sparklineData = sensor.trend.slice(-15);
  const sparklinePath = createSparklinePath(sparklineData);

  return (
    <div className={`rounded-xl border-2 p-6 transition-all duration-300 hover:scale-105 ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-300">{sensor.name}</h3>
        {getTrendIcon()}
      </div>
      
      <div className="flex items-baseline space-x-2 mb-4">
        <span className="text-3xl font-bold text-white">
          {formatValue(sensor.value)}
        </span>
        <span className="text-sm text-gray-400">{sensor.unit}</span>
      </div>
      
      {/* Enhanced sparkline with smooth curves */}
      <div className="relative h-16 mb-2">
        <svg width="120" height="60" className="w-full h-full">
          <defs>
            <linearGradient id={`gradient-${sensor.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.1"/>
            </linearGradient>
            
            <filter id={`glow-${sensor.id}`}>
              <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Area fill */}
          <path
            d={`${sparklinePath} L 120 60 L 0 60 Z`}
            fill={`url(#gradient-${sensor.id})`}
            opacity="0.6"
          />
          
          {/* Main line */}
          <path
            d={sparklinePath}
            fill="none"
            stroke="#06B6D4"
            strokeWidth="2"
            filter={`url(#glow-${sensor.id})`}
            className="transition-all duration-300"
          />
          
          {/* Data points */}
          {sparklineData.map((value, index) => {
            const maxValue = Math.max(...sparklineData);
            const minValue = Math.min(...sparklineData);
            const range = maxValue - minValue || 1;
            const x = (index / (sparklineData.length - 1)) * 120;
            const y = 60 - ((value - minValue) / range) * 60;
            
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="2"
                fill="#06B6D4"
                className="opacity-0 hover:opacity-100 transition-opacity duration-200"
              >
                <title>{`${sensor.name}: ${value.toFixed(2)} ${sensor.unit}`}</title>
              </circle>
            );
          })}
          
          {/* Latest value indicator */}
          <circle
            cx="120"
            cy={60 - ((sensor.value - Math.min(...sparklineData)) / (Math.max(...sparklineData) - Math.min(...sparklineData) || 1)) * 60}
            r="3"
            fill="#06B6D4"
            stroke="#1F2937"
            strokeWidth="1"
            className="animate-pulse"
          />
        </svg>
      </div>
      
      {/* Status indicator */}
      <div className="flex items-center justify-between text-xs">
        <span className={`px-2 py-1 rounded-full font-medium ${
          sensor.status === 'critical' 
            ? 'bg-red-500/20 text-red-400' 
            : sensor.status === 'warning'
            ? 'bg-orange-500/20 text-orange-400'
            : 'bg-green-500/20 text-green-400'
        }`}>
          {sensor.status.toUpperCase()}
        </span>
        <span className="text-gray-400">
          {sparklineData.length} samples
        </span>
      </div>
    </div>
  );
};