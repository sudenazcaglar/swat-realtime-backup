import React, { useState, useEffect } from 'react';
import { PlantSchematic } from '../components/Control/PlantSchematic';
import { ControlPanel } from '../components/Control/ControlPanel';
import { EffectPreview } from '../components/Control/EffectPreview';

export const Control: React.FC = () => {
  const [valvePositions, setValvePositions] = useState({
    valve1: 50,
    valve2: 75,
    valve3: 80,
    valve4: 60,
  });

  const [pumpStates, setPumpStates] = useState({
    pump1: true,
    pump2: false,
    pump3: true,
  });

  const [flowRates, setFlowRates] = useState({
    flow1: 10,
    flow2: 8,
    flow3: 12,
    flow4: 9,
    flow5: 11,
    flow6: 10,
  });

  const [beforeValues] = useState({
    flow: 15.2,
    pressure: 2.8,
    temperature: 23.5,
    conductivity: 1250,
  });

  const [afterValues, setAfterValues] = useState({
    flow: 15.2,
    pressure: 2.8,
    temperature: 23.5,
    conductivity: 1250,
  });

  const [anomalyScore, setAnomalyScore] = useState(0.3);

  useEffect(() => {
    // Simulate real-time effects of control changes
    const interval = setInterval(() => {
      const avgValvePosition = Object.values(valvePositions).reduce((sum, pos) => sum + pos, 0) / Object.values(valvePositions).length;
      const activePumps = Object.values(pumpStates).filter(Boolean).length;
      
      // Calculate simulated effects
      const flowEffect = (avgValvePosition / 100) * (activePumps / 3) * 20;
      const pressureEffect = (activePumps / 3) * 4;
      const tempEffect = 22 + (flowEffect / 10);
      const conductivityEffect = 1200 + Math.sin(Date.now() / 10000) * 100;
      
      setAfterValues({
        flow: flowEffect,
        pressure: pressureEffect,
        temperature: tempEffect,
        conductivity: conductivityEffect,
      });

      // Calculate anomaly score based on deviations
      const flowDeviation = Math.abs(flowEffect - beforeValues.flow) / beforeValues.flow;
      const pressureDeviation = Math.abs(pressureEffect - beforeValues.pressure) / beforeValues.pressure;
      const tempDeviation = Math.abs(tempEffect - beforeValues.temperature) / beforeValues.temperature;
      const conductivityDeviation = Math.abs(conductivityEffect - beforeValues.conductivity) / beforeValues.conductivity;
      
      const avgDeviation = (flowDeviation + pressureDeviation + tempDeviation + conductivityDeviation) / 4;
      setAnomalyScore(Math.min(1, avgDeviation * 2));

      // Update flow rates based on pump states and valve positions
      const newFlowRates = Object.keys(flowRates).reduce((acc, key) => {
        const baseFlow = 10;
        const pumpMultiplier = activePumps / 3;
        const valveMultiplier = avgValvePosition / 100;
        acc[key] = baseFlow * pumpMultiplier * valveMultiplier + Math.random() * 2;
        return acc;
      }, {} as typeof flowRates);
      
      setFlowRates(newFlowRates);
    }, 1000);

    return () => clearInterval(interval);
  }, [valvePositions, pumpStates, beforeValues]);

  const handleValveChange = (valve: string, position: number) => {
    setValvePositions(prev => ({
      ...prev,
      [valve]: position,
    }));
  };

  const handlePumpToggle = (pump: string) => {
    setPumpStates(prev => ({
      ...prev,
      [pump]: !prev[pump],
    }));
  };

  const handleInjectFault = (faultType: string) => {
    switch (faultType) {
      case 'valve_stuck':
        setValvePositions(prev => ({
          ...prev,
          valve2: 0, // Simulate stuck valve
        }));
        break;
      case 'pump_failure':
        setPumpStates(prev => ({
          ...prev,
          pump1: false,
        }));
        break;
      case 'sensor_drift':
        setAnomalyScore(0.9);
        break;
      case 'flow_blockage':
        setFlowRates(prev => Object.keys(prev).reduce((acc, key) => {
          acc[key] = prev[key] * 0.3; // Reduce all flows
          return acc;
        }, {} as typeof prev));
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Plant Schematic - Takes up 2 columns */}
        <div className="xl:col-span-2">
          <PlantSchematic
            valvePositions={valvePositions}
            pumpStates={pumpStates}
            flowRates={flowRates}
          />
        </div>

        {/* Control Panel */}
        <div>
          <ControlPanel
            valvePositions={valvePositions}
            pumpStates={pumpStates}
            onValveChange={handleValveChange}
            onPumpToggle={handlePumpToggle}
            onInjectFault={handleInjectFault}
          />
        </div>
      </div>

      {/* Effect Preview - Full width */}
      <div>
        <EffectPreview
          beforeValues={beforeValues}
          afterValues={afterValues}
          anomalyScore={anomalyScore}
        />
      </div>
    </div>
  );
};