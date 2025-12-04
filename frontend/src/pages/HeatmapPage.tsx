// src/pages/HeatmapPage.tsx
import React from "react";
import { Heatmap } from "../components/Dashboard/Heatmap";
import { useSwatRealtimeData } from "../hooks/useSwatRealtimeData";

export const HeatmapPage: React.FC = () => {
  const { heatmapData } = useSwatRealtimeData();

  return (
    <div className="h-full">
      <Heatmap data={heatmapData} />
    </div>
  );
};
