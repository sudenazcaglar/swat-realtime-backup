// src/hooks/useSwatRealtimeData.ts
import { useEffect, useRef, useState } from "react";
import { SensorData, AnomalyEvent, HeatmapData } from "../types";

// Backend WebSocket URL'i – istersen .env ile override edebilirsin
const WS_URL =
  (import.meta as any).env?.VITE_BACKEND_WS_URL ??
  "ws://localhost:8000/ws/stream";

type BackendPrediction = {
  anomaly_score: number;
  is_attack: boolean;
} | null;

type BackendMessage = {
  index: number;
  timestamp: string;
  sensors: Record<string, number>;
  label: number | string | null;
  prediction: BackendPrediction;
};

// SWaT tarafında UI'da göstermek istediğin sensörler.
// id'ler backend'den gelen "sensors" key'leri ile aynı olmalı.
const SENSOR_META: Omit<SensorData, "value" | "trend">[] = [
  { id: "lit101", name: "Tank Level LIT101", unit: "%", status: "normal" },
  { id: "fit101", name: "Flow FIT101", unit: "m³/h", status: "normal" },
  {
    id: "ait201",
    name: "Conductivity AIT201",
    unit: "µS/cm",
    status: "normal",
  },
  // buraya istediğin diğer SWaT sensörlerini ekleyebilirsin
  { id: "anomaly_score", name: "Anomaly Score", unit: "", status: "normal" },
];

// Trend kuyruk uzunluğu (kartlarda ve grafikte kullanılacak)
const MAX_TREND_LENGTH = 150;

// hook imzasını şimdilik useSimulatedData ile uyumlu tutuyoruz.
// speed parametresini şu an backend'e göndermiyoruz, sadece signture'ı bozmayalım diye duruyor.
export const useSwatRealtimeData = (_speed: number = 1) => {
  const [sensors, setSensors] = useState<SensorData[]>([]);
  const [events, setEvents] = useState<AnomalyEvent[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [currentTimestamp, setCurrentTimestamp] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const lastAttackRef = useRef<boolean>(false); // ardışık is_attack=true'larda event spam'i önlemek için

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("[WS] Connected to", WS_URL);
    };

    ws.onmessage = (event) => {
      const data: BackendMessage = JSON.parse(event.data);
      console.log("[WS] message", data);
      const ts = new Date(data.timestamp);
      setCurrentTimestamp(data.timestamp);

      // 1) Sensor kartları / trend verisi
      setSensors((prev) => {
        const map = new Map<string, SensorData>();
        prev.forEach((s) => map.set(s.id, s));

        SENSOR_META.forEach((meta) => {
          const existing = map.get(meta.id);

          const sensorKey = meta.id;

          // backend'den gelen ham değer:
          const backendValue =
            sensorKey === "anomaly_score"
              ? data.prediction?.anomaly_score
              : data.sensors[sensorKey];

          const rawValue =
            typeof backendValue === "number" && Number.isFinite(backendValue)
              ? backendValue
              : 0;

          const trend = existing
            ? [...existing.trend, rawValue].slice(-MAX_TREND_LENGTH)
            : [rawValue];

          map.set(meta.id, {
            ...meta,
            value: rawValue,
            trend,
            status: determineStatus(meta.id, rawValue),
          });
        });

        return Array.from(map.values());
      });

      // 2) Anomaly Event Log
      const fromLabelAttack =
        typeof data.label === "string" && data.label === "attack";

      const fromModelAttack = !!data.prediction?.is_attack;

      const isAttack = fromLabelAttack || fromModelAttack;
      const score = data.prediction?.anomaly_score ?? 0;

      if (isAttack && !lastAttackRef.current) {
        const severity: AnomalyEvent["severity"] =
          score > 0.9 ? "high" : score > 0.75 ? "medium" : "low";

        const newEvent: AnomalyEvent = {
          id: `${data.index}`,
          timestamp: ts,
          severity,
          message: fromModelAttack
            ? `Model detected anomaly (score = ${score.toFixed(3)})`
            : "Ground-truth attack segment",
          sensor: "anomaly_score",
          value: score,
        };

        console.log("[EVENT] adding anomaly event", newEvent);
        setEvents((prev) => [newEvent, ...prev].slice(0, 50)); // son 50 event'i tut
      }

      lastAttackRef.current = isAttack;

      // 3) Heatmap verisi
      setHeatmapData((prev) => {
        const newRows: HeatmapData[] = Object.entries(data.sensors).map(
          ([sensor, value]) => ({
            sensor,
            time: ts.toISOString(),
            value,
            anomaly: isAttack,
          })
        );

        const merged = [...prev, ...newRows];
        return merged.slice(-2000); // hafızayı şişirmemek için limit
      });
    };

    ws.onerror = (err) => {
      console.error("[WS] Error:", err);
    };

    ws.onclose = () => {
      console.log("[WS] Closed");
    };

    // cleanup
    return () => {
      ws.close();
    };
  }, []);

  return { sensors, events, heatmapData, currentTimestamp };
};

// Sensör kartlarında kullanılacak status hesaplama fonksiyonu
function determineStatus(
  sensorId: string,
  value: number
): "normal" | "warning" | "critical" {
  // Burayı SWaT sensörlerinin gerçek aralıklarına göre ince ayar yapacağız.
  const thresholds: Record<string, { warning: number; critical: number }> = {
    lit101: { warning: 70, critical: 85 },
    fit101: { warning: 1.5, critical: 2.0 },
    ait201: { warning: 1200, critical: 1400 },
    anomaly_score: { warning: 0.7, critical: 0.9 },
  };

  const th = thresholds[sensorId];
  if (!th) return "normal";

  if (value > th.critical) return "critical";
  if (value > th.warning) return "warning";
  return "normal";
}
