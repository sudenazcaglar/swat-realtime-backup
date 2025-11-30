import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface EffectPreviewProps {
  beforeValues: { [key: string]: number };
  afterValues: { [key: string]: number };
  anomalyScore: number;
}

export const EffectPreview: React.FC<EffectPreviewProps> = ({
  beforeValues,
  afterValues,
  anomalyScore,
}) => {
  const metrics = [
    { key: 'flow', label: 'Flow Rate', unit: 'L/s' },
    { key: 'pressure', label: 'Pressure', unit: 'bar' },
    { key: 'temperature', label: 'Temperature', unit: '°C' },
    { key: 'conductivity', label: 'Conductivity', unit: 'µS/cm' },
  ];

  const getChangeIcon = (before: number, after: number) => {
    const change = ((after - before) / before) * 100;
    if (Math.abs(change) < 1) return null;
    
    return change > 0 
      ? <TrendingUp className="w-4 h-4 text-green-400" />
      : <TrendingDown className="w-4 h-4 text-red-400" />;
  };

  const getChangeColor = (before: number, after: number) => {
    const change = ((after - before) / before) * 100;
    if (Math.abs(change) < 1) return 'text-gray-400';
    return change > 0 ? 'text-green-400' : 'text-red-400';
  };

  const formatChange = (before: number, after: number) => {
    const change = ((after - before) / before) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Real-time Effect Preview</h3>
      
      {/* Anomaly Score */}
      <div className={`p-4 rounded-lg mb-4 border-2 ${
        anomalyScore > 0.8 
          ? 'border-red-500 bg-red-500/10' 
          : anomalyScore > 0.6
          ? 'border-orange-500 bg-orange-500/10'
          : 'border-green-500 bg-green-500/10'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {anomalyScore > 0.6 && <AlertTriangle className="w-5 h-5 text-orange-400" />}
            <span className="font-medium text-white">Anomaly Score</span>
          </div>
          <span className={`text-2xl font-bold ${
            anomalyScore > 0.8 ? 'text-red-400' : anomalyScore > 0.6 ? 'text-orange-400' : 'text-green-400'
          }`}>
            {(anomalyScore * 100).toFixed(1)}%
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              anomalyScore > 0.8 ? 'bg-red-500' : anomalyScore > 0.6 ? 'bg-orange-500' : 'bg-green-500'
            }`}
            style={{ width: `${anomalyScore * 100}%` }}
          />
        </div>
      </div>

      {/* Metric Changes */}
      <div className="space-y-3">
        {metrics.map((metric) => {
          const before = beforeValues[metric.key] || 0;
          const after = afterValues[metric.key] || 0;
          
          return (
            <div
              key={metric.key}
              className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {getChangeIcon(before, after)}
                <span className="text-sm font-medium text-gray-300">
                  {metric.label}
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-400">Before</div>
                  <div className="text-sm font-medium text-white">
                    {before.toFixed(1)} {metric.unit}
                  </div>
                </div>
                
                <div className="w-px h-8 bg-gray-600" />
                
                <div className="text-right">
                  <div className="text-sm text-gray-400">After</div>
                  <div className="text-sm font-medium text-white">
                    {after.toFixed(1)} {metric.unit}
                  </div>
                </div>
                
                <div className="text-right min-w-[60px]">
                  <div className="text-sm text-gray-400">Change</div>
                  <div className={`text-sm font-medium ${getChangeColor(before, after)}`}>
                    {formatChange(before, after)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Warning message */}
      {anomalyScore > 0.7 && (
        <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-orange-400 font-medium">
              High anomaly score detected - Review control actions
            </span>
          </div>
        </div>
      )}
    </div>
  );
};