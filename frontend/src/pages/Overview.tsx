// import React, { useEffect, useState } from "react";
import { TrendChart } from "../components/Dashboard/TrendChart";
// import { AnomalyChart } from "../components/Dashboard/AnomalyChart";
// import { Heatmap } from "../components/Dashboard/Heatmap";
// import { EventLog } from "../components/Dashboard/EventLog";
import { useSwatRealtime } from "../context/SwatRealtimeContext";
// import { useSwatRealtimeData } from "../hooks/useSwatRealtimeData";
// import { useSimulatedData } from "../hooks/useSimulatedData";

// const API_BASE =
//   (import.meta as any).env?.VITE_BACKEND_HTTP_URL ?? "http://localhost:8000";

// const formatTimestamp = (ts: string | null) => {
//   if (!ts) return "—";

//   const date = new Date(ts);

//   return date.toLocaleString("en-US", {
//     year: "numeric",
//     month: "long",
//     day: "2-digit",
//     hour: "2-digit",
//     minute: "2-digit",
//     second: "2-digit",
//   });
// };

interface OverviewProps {
  onTimeLabelChange?: (label: string | undefined) => void;
}

export const Overview: React.FC<OverviewProps> = () => {

  // 🔹 Artık global context'ten alıyoruz
  const { sensors } = useSwatRealtime();

  // Replay timestamp'i üst seviyeye bildir (Layout sağ üst için)
  // useEffect(() => {
  //   if (onTimeLabelChange) {
  //     const label =
  //       currentTimestamp != null
  //         ? formatTimestamp(currentTimestamp)
  //         : undefined;
  //     onTimeLabelChange(label);
  //   }
  // }, [currentTimestamp, onTimeLabelChange]);

  // Grafikler için sensör grupları (P1–P6)
  const pickSensors = (ids: string[]) =>
    sensors.filter((s) => ids.includes(s.id));

  // P1 – Raw Water
  const p1Sensors = pickSensors(["fit101", "lit101"]);

  // P2 – Chemical Dosing
  const p2Sensors = pickSensors(["ait201", "fit201", "ait203"]);

  // P3 – Ultrafiltration
  const p3Sensors = pickSensors(["fit301", "dpit301", "lit301"]);

  // P4 – Dechlorination / RO Feed Tank
  const p4Sensors = pickSensors(["ait401", "ait402", "lit401"]);

  // P5 – Reverse Osmosis (fixed set)
  const p5Sensors = pickSensors(["ait503", "ait504", "pit502"]);

  // P6 – Backwash
  const p6Sensors = pickSensors(["fit601"]);

  // Anomaly
  const anomalySensors = pickSensors(["anomaly_score"]);

  // // Grafikler için sensör grupları
  // const flowSensors = sensors.filter((s) =>
  //   ["fit101", "ait201"].includes(s.id)
  // );
  // const systemSensors = sensors.filter((s) => ["lit101"].includes(s.id));
  // const anomalySensors = sensors.filter((s) => s.id === "anomaly_score");

  return (
    <div className="space-y-6">
      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TrendChart title="P1 – Raw Water (FIT101 & LIT101)" sensors={p1Sensors} />
        <TrendChart title="P2 – Chemical Dosing (AIT201, FIT201, AIT203)" sensors={p2Sensors} />
        <TrendChart title="P3 – Ultrafiltration (FIT301, DPIT301, LIT301)" sensors={p3Sensors} />
        <TrendChart title="P4 – Dechlorination (AIT401, AIT402, LIT401)" sensors={p4Sensors} />
        <TrendChart title="P5 – Reverse Osmosis (AIT503, AIT504, PIT502)" sensors={p5Sensors} />
        <TrendChart title="P6 – Backwash (FIT601)" sensors={p6Sensors} />
      </div>

      {/* Anomaly Chart */}
      <div className="grid grid-cols-1 gap-6">
        <TrendChart
          title="Anomaly Score"
          sensors={anomalySensors}
          showThreshold={false}
        />
      </div>

      {/* {anomalySensors.length > 0 && ( */}
        {/* <div>
          <AnomalyChart sensor={anomalySensors[0]} thresholdValue={0.8} />
        </div>
      )} */}

      {/* Event Log & Heatmap */}
      {/* <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
        <EventLog events={events} /> */}
        {/* <Heatmap data={heatmapData} /> */}
      {/* </div> */}
    </div>
  );
};