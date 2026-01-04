import React from "react";
import { MetricCard } from "../components/Dashboard/MetricCard";
import { useSwatRealtime } from "../context/SwatRealtimeContext";

export const Control: React.FC = () => {
  // Global context'ten sensörleri al
  const { sensors } = useSwatRealtime();

  return (
    <div className="space-y-6">
      <div className="flex gap-6 items-start">
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sensors.map((sensor) => (
              <MetricCard key={sensor.id} sensor={sensor} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
