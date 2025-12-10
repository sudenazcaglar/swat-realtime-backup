// src/pages/Logs.tsx
import React from "react";
import { EventLog } from "../components/Dashboard/EventLog";
import { useSwatRealtime } from "../context/SwatRealtimeContext";

export const Logs: React.FC = () => {
  const { events } = useSwatRealtime();

  return (
    <div className="p-6 h-full">
      <h2 className="text-2xl font-semibold text-white mb-4">
        System Event Log
      </h2>
      <EventLog events={events} />
    </div>
  );
};
