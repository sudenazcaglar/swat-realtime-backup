import React from 'react';
import { Power, AlertTriangle } from 'lucide-react';

interface ControlPanelProps {
  valvePositions: { [key: string]: number };
  pumpStates: { [key: string]: boolean };
  onValveChange: (valve: string, position: number) => void;
  onPumpToggle: (pump: string) => void;
  onInjectFault: (faultType: string) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  valvePositions,
  pumpStates,
  onValveChange,
  onPumpToggle,
  onInjectFault,
}) => {
  const valves = ['valve1', 'valve2', 'valve3', 'valve4'];
  const pumps = ['pump1', 'pump2', 'pump3'];
  const faultTypes = [
    { id: 'valve_stuck', label: 'Valve Stuck' },
    { id: 'pump_failure', label: 'Pump Failure' },
    { id: 'sensor_drift', label: 'Sensor Drift' },
    { id: 'flow_blockage', label: 'Flow Blockage' },
  ];

  return (
    <div className="space-y-6">
      {/* Valve Controls */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Valve Control</h3>
        
        <div className="grid grid-cols-2 gap-4">
          {valves.map((valve) => (
            <div key={valve} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  {valve.toUpperCase()}
                </label>
                <span className="text-sm text-cyan-400">
                  {(valvePositions[valve] || 0).toFixed(0)}%
                </span>
              </div>
              
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={valvePositions[valve] || 0}
                  onChange={(e) => onValveChange(valve, parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #06B6D4 0%, #06B6D4 ${valvePositions[valve] || 0}%, #374151 ${valvePositions[valve] || 0}%, #374151 100%)`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pump Controls */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Pump Control</h3>
        
        <div className="grid grid-cols-3 gap-4">
          {pumps.map((pump) => {
            const isActive = pumpStates[pump] || false;
            
            return (
              <button
                key={pump}
                onClick={() => onPumpToggle(pump)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center space-y-2 ${
                  isActive
                    ? 'border-green-500 bg-green-500/10 text-green-400'
                    : 'border-gray-600 bg-gray-700/30 text-gray-400 hover:border-gray-500'
                }`}
              >
                <Power className={`w-6 h-6 ${isActive ? 'animate-pulse' : ''}`} />
                <span className="text-sm font-medium">
                  {pump.toUpperCase()}
                </span>
                <span className="text-xs">
                  {isActive ? 'ON' : 'OFF'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fault Injection */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          <span>Fault Injection (Demo)</span>
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          {faultTypes.map((fault) => (
            <button
              key={fault.id}
              onClick={() => onInjectFault(fault.id)}
              className="p-3 rounded-lg border border-orange-600 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-all duration-200 text-sm font-medium"
            >
              {fault.label}
            </button>
          ))}
        </div>
        
        <p className="text-xs text-gray-400 mt-3">
          Click to simulate system faults for testing anomaly detection
        </p>
      </div>
    </div>
  );
};