import { useState, useEffect } from 'react';
import { SensorData, AnomalyEvent, HeatmapData } from '../types';

const SENSORS: Omit<SensorData, 'value' | 'trend'>[] = [
  { id: 'temp', name: 'Temperature', unit: '°C', status: 'normal' },
  { id: 'humidity', name: 'Humidity', unit: '%', status: 'normal' },
  { id: 'co2', name: 'CO₂', unit: 'ppm', status: 'normal' },
  { id: 'flow', name: 'Flow Rate', unit: 'L/s', status: 'normal' },
  { id: 'conductivity', name: 'Conductivity', unit: 'µS/cm', status: 'normal' },
  { id: 'anomaly', name: 'Anomaly Score', unit: '', status: 'normal' },
];

export const useSimulatedData = (speed: number = 1) => {
  const [sensors, setSensors] = useState<SensorData[]>([]);
  const [events, setEvents] = useState<AnomalyEvent[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);

  useEffect(() => {
    // Initialize sensors
    setSensors(SENSORS.map(sensor => ({
      ...sensor,
      value: generateRandomValue(sensor.id),
      trend: Array.from({ length: 20 }, () => generateRandomValue(sensor.id)),
    })));

    // Initialize events
    const initialEvents: AnomalyEvent[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 300000),
        severity: 'medium',
        message: 'Conductivity spike detected',
        sensor: 'conductivity',
        value: 1250,
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 180000),
        severity: 'low',
        message: 'Temperature fluctuation',
        sensor: 'temp',
        value: 28.5,
      },
    ];
    setEvents(initialEvents);

    // Initialize heatmap
    const timeSlots = Array.from({ length: 24 }, (_, i) => 
      String(i).padStart(2, '0') + ':00'
    );
    const initialHeatmap = SENSORS.flatMap(sensor =>
      timeSlots.map(time => ({
        sensor: sensor.name,
        time,
        value: Math.random(),
        anomaly: Math.random() > 0.9,
      }))
    );
    setHeatmapData(initialHeatmap);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSensors(prev => prev.map(sensor => {
        const newValue = generateRandomValue(sensor.id);
        const newTrend = [...sensor.trend.slice(1), newValue];
        const status = determineStatus(sensor.id, newValue);
        
        return {
          ...sensor,
          value: newValue,
          trend: newTrend,
          status,
        };
      }));

      // Occasionally add new events
      if (Math.random() > 0.95) {
        const anomalySensor = SENSORS[Math.floor(Math.random() * SENSORS.length)];
        const newEvent: AnomalyEvent = {
          id: Date.now().toString(),
          timestamp: new Date(),
          severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
          message: `${anomalySensor.name} anomaly detected`,
          sensor: anomalySensor.id,
          value: generateRandomValue(anomalySensor.id),
        };
        
        setEvents(prev => [newEvent, ...prev.slice(0, 9)]);
      }
    }, 2000 / speed);

    return () => clearInterval(interval);
  }, [speed]);

  return { sensors, events, heatmapData };
};

function generateRandomValue(sensorId: string): number {
  const ranges = {
    temp: [20, 35],
    humidity: [40, 80],
    co2: [400, 1200],
    flow: [5, 25],
    conductivity: [800, 1500],
    anomaly: [0, 1],
  };
  
  const [min, max] = ranges[sensorId as keyof typeof ranges] || [0, 100];
  return Math.random() * (max - min) + min;
}

function determineStatus(sensorId: string, value: number): 'normal' | 'warning' | 'critical' {
  const thresholds = {
    temp: { warning: 30, critical: 33 },
    humidity: { warning: 70, critical: 85 },
    co2: { warning: 1000, critical: 1100 },
    flow: { warning: 20, critical: 23 },
    conductivity: { warning: 1300, critical: 1400 },
    anomaly: { warning: 0.7, critical: 0.9 },
  };
  
  const threshold = thresholds[sensorId as keyof typeof thresholds];
  if (!threshold) return 'normal';
  
  if (value > threshold.critical) return 'critical';
  if (value > threshold.warning) return 'warning';
  return 'normal';
}