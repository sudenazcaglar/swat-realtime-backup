import React, { useState } from "react";
import { MetricCard } from "../components/Dashboard/MetricCard";
import { TrendChart } from "../components/Dashboard/TrendChart";
import { AnomalyChart } from "../components/Dashboard/AnomalyChart";
import { Heatmap } from "../components/Dashboard/Heatmap";
import { EventLog } from "../components/Dashboard/EventLog";
import { SpeedControl } from "../components/Dashboard/SpeedControl";
import { useSwatRealtimeData } from "../hooks/useSwatRealtimeData";
// import { useSimulatedData } from '../hooks/useSimulatedData';

// HTTP taban URL – istersen .env ile override edebilirsin
const API_BASE =
  (import.meta as any).env?.VITE_BACKEND_HTTP_URL ?? "http://localhost:8000";

export const Overview: React.FC = () => {
  const [speed, setSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);

  // const { sensors, events, heatmapData } = useSimulatedData(isPlaying ? speed : 0);
  const { sensors, events, heatmapData } = useSwatRealtimeData(
    isPlaying ? speed : 0
  );

  const handlePlayPause = async () => {
    const next = !isPlaying;
    setIsPlaying(next);

    try {
      const endpoint = next ? "/control/play" : "/control/pause";
      await fetch(`${API_BASE}${endpoint}`, { method: "POST" });
    } catch (err) {
      console.error("[ReplayControl] play/pause error", err);
    }
  };

  const handleSpeedChange = async (newSpeed: number) => {
    setSpeed(newSpeed);

    // Hız değişince otomatik play'e geçmek istiyoruz
    const wasPaused = !isPlaying;
    if (wasPaused) {
      setIsPlaying(true);
    }

    try {
      await fetch(`${API_BASE}/control/speed/${newSpeed}`, {
        method: "POST",
      });

      // Eğer önceden pause'da ise, backend'i de play'e al
      if (wasPaused) {
        await fetch(`${API_BASE}/control/play`, { method: "POST" });
      }
    } catch (err) {
      console.error("[ReplayControl] speed change error", err);
    }
  };

  // Grafikler için sensör grupları
  const flowSensors = sensors.filter((s) =>
    ["fit101", "ait201"].includes(s.id)
  );
  const systemSensors = sensors.filter((s) => ["lit101"].includes(s.id));
  const anomalySensors = sensors.filter((s) => s.id === "anomaly_score");

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
