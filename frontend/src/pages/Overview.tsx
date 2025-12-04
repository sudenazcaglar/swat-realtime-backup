import React, { useEffect, useState } from "react";
import { MetricCard } from "../components/Dashboard/MetricCard";
import { TrendChart } from "../components/Dashboard/TrendChart";
import { AnomalyChart } from "../components/Dashboard/AnomalyChart";
import { Heatmap } from "../components/Dashboard/Heatmap";
import { EventLog } from "../components/Dashboard/EventLog";
import { SpeedControl } from "../components/Dashboard/SpeedControl";
import { useSwatRealtime } from "../context/SwatRealtimeContext";
// import { useSwatRealtimeData } from "../hooks/useSwatRealtimeData";
// import { useSimulatedData } from "../hooks/useSimulatedData";

const API_BASE =
  (import.meta as any).env?.VITE_BACKEND_HTTP_URL ?? "http://localhost:8000";

const formatTimestamp = (ts: string | null) => {
  if (!ts) return "—";

  const date = new Date(ts);

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

interface OverviewProps {
  onTimeLabelChange?: (label: string | undefined) => void;
}

export const Overview: React.FC<OverviewProps> = ({ onTimeLabelChange }) => {
  const [speed, setSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);

  // 🔹 Artık global context'ten alıyoruz
  const {
    sensors,
    events,
    heatmapData,
    currentTimestamp,
    setPlaybackSpeed,
  } = useSwatRealtime();

  // 🔹 isPlaying / speed değiştikçe global playbackSpeed'i güncelle
  useEffect(() => {
    setPlaybackSpeed(isPlaying ? speed : 0);
  }, [isPlaying, speed, setPlaybackSpeed]);

  // Replay timestamp'i üst seviyeye bildir (Layout sağ üst için)
  useEffect(() => {
    if (onTimeLabelChange) {
      const label =
        currentTimestamp != null
          ? formatTimestamp(currentTimestamp)
          : undefined;
      onTimeLabelChange(label);
    }
  }, [currentTimestamp, onTimeLabelChange]);

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

    const wasPaused = !isPlaying;
    if (wasPaused) {
      setIsPlaying(true);
    }

    try {
      await fetch(`${API_BASE}/control/speed/${newSpeed}`, {
        method: "POST",
      });

      if (wasPaused) {
        await fetch(`${API_BASE}/control/play`, { method: "POST" });
      }
    } catch (err) {
      console.error("[ReplayControl] speed change error", err);
    }
  };

  const handleReset = async () => {
    try {
      // Baştan başlat
      await fetch(`${API_BASE}/control/jump/0`, { method: "POST" });

      // Pause durumundaysa otomatik play'e al
      if (!isPlaying) {
        setIsPlaying(true);
        await fetch(`${API_BASE}/control/play`, { method: "POST" });
      }
    } catch (err) {
      console.error("[ReplayControl] reset error", err);
    }
  };

  const handleRewind = async () => {
    try {
      // 1) Mevcut index'i al
      const res = await fetch(`${API_BASE}/status`);
      const status = await res.json();
      const currentIndex: number = status.current_index ?? 0;

      // 2) Hıza göre geriye gidilecek süre (saniye)
      let backSeconds: number;
      if (speed === 0.5) backSeconds = 30;
      else if (speed === 1) backSeconds = 60;
      else if (speed === 2) backSeconds = 120;
      else if (speed === 5) backSeconds = 300;
      else if (speed === 10) backSeconds = 600;
      else backSeconds = 60;

      // SWaT datası saniyede 1 kayıt gibi, o yüzden
      // "saniye" ≈ "satır" diyebiliriz:
      const newIndex = Math.max(currentIndex - backSeconds, 0);

      // 3) O index'e zıpla
      await fetch(`${API_BASE}/control/jump/${newIndex}`, {
        method: "POST",
      });

      // 4) Eğer pause'daysak otomatik play'e al
      if (!isPlaying) {
        setIsPlaying(true);
        await fetch(`${API_BASE}/control/play`, { method: "POST" });
      }
    } catch (err) {
      console.error("[ReplayControl] rewind error", err);
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
    {/* Top row: Metric cards + Replay Control aynı satırda */}
    <div className="flex gap-6 items-start">
      {/* Sol: Metric cards */}
      <div className="flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sensors.map((sensor) => (
            <MetricCard key={sensor.id} sensor={sensor} />
          ))}
        </div>
      </div>

      {/* Sağ: Replay Control */}
      <div className="w-80 shrink-0">
        <SpeedControl
          speed={speed}
          onSpeedChange={handleSpeedChange}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onReset={handleReset}
          onRewind={handleRewind}
        />
      </div>
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
