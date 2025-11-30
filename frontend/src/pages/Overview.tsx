import React, { useState } from "react";
import { MetricCard } from "../components/Dashboard/MetricCard";
import { TrendChart } from "../components/Dashboard/TrendChart";
import { AnomalyChart } from "../components/Dashboard/AnomalyChart";
import { Heatmap } from "../components/Dashboard/Heatmap";
import { EventLog } from "../components/Dashboard/EventLog";
import { SpeedControl } from "../components/Dashboard/SpeedControl";
import { useSwatRealtimeData } from "../hooks/useSwatRealtimeData";
// import { useSimulatedData } from '../hooks/useSimulatedData';

export const Overview: React.FC = () => {
  const [speed, setSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  // const { sensors, events, heatmapData } = useSimulatedData(isPlaying ? speed : 0);
  const { sensors, events, heatmapData } = useSwatRealtimeData(
    isPlaying ? speed : 0
  );

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (!isPlaying) {
      setIsPlaying(true);
    }
  };

  // Group sensors for different charts
  const flowSensors = sensors.filter((s) =>
    ["flow", "conductivity"].includes(s.id)
  );
  const systemSensors = sensors.filter((s) =>
    ["temp", "humidity"].includes(s.id)
  );
  const anomalySensors = sensors.filter((s) => s.id === "anomaly");

  return (
    <div className="space-y-6">
      {/* Speed Control */}
      <div className="flex justify-end">
        <div className="w-80">
          <SpeedControl
            speed={speed}
            onSpeedChange={handleSpeedChange}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
          />
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {sensors.map((sensor) => (
          <MetricCard key={sensor.id} sensor={sensor} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TrendChart title="Flow Rate & Conductivity" sensors={flowSensors} />

        <TrendChart title="Temperature & Humidity" sensors={systemSensors} />
      </div>

      {/* Anomaly Chart */}
      <div className="grid grid-cols-1 gap-6">
        <TrendChart
          title="Anomaly Score vs Threshold"
          sensors={anomalySensors}
          showThreshold={true}
          thresholdValue={0.8}
        />
      </div>

      {anomalySensors.length > 0 && (
        <div>
          <AnomalyChart sensor={anomalySensors[0]} thresholdValue={0.8} />
        </div>
      )}

      {/* Event Log & Heatmap */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <EventLog events={events} />
        <Heatmap data={heatmapData} />
      </div>
    </div>
  );
};
