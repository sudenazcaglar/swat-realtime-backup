// src/pages/HeatmapPage.tsx
import React from "react";
import { Heatmap } from "../components/Dashboard/Heatmap";
import { useSwatRealtime } from "../context/SwatRealtimeContext";
// import { useSwatRealtimeData } from "../hooks/useSwatRealtimeData";

export const HeatmapPage: React.FC = () => {
  const { heatmapData } = useSwatRealtime();

  return (
    <div className="h-full">
      <Heatmap data={heatmapData} />
    </div>
  );
};
