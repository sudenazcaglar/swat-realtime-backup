import React from 'react';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { AnomalyEvent } from '../../types';

interface EventLogProps {
  events: AnomalyEvent[];
}

export const EventLog: React.FC<EventLogProps> = ({ events }) => {
  const getIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      default: return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-l-red-500 bg-red-500/5';
      case 'medium': return 'border-l-orange-500 bg-orange-500/5';
      default: return 'border-l-blue-500 bg-blue-500/5';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Event Log</h3>
      
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {events.length === 0 ? (
          <div className="text-gray-400 text-center py-4">
            No recent events
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className={`border-l-4 pl-4 py-3 rounded-r-lg transition-all duration-200 hover:bg-gray-700/30 ${getSeverityColor(event.severity)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getIcon(event.severity)}
                  <span className="text-sm font-medium text-white">
                    {formatTime(event.timestamp)}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  event.severity === 'high' 
                    ? 'bg-red-500/20 text-red-400' 
                    : event.severity === 'medium'
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  {event.severity.toUpperCase()}
                </span>
              </div>
              
              <p className="text-sm text-gray-300 mb-1">
                {event.message}
              </p>
              
              {event.value && (
                <p className="text-xs text-gray-400">
                  Sensor: {event.sensor} | Value: {event.value.toFixed(2)}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};