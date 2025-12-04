import React from "react";
import { HeatmapData } from "../../types";

interface HeatmapProps {
  data: HeatmapData[];
}

export const Heatmap: React.FC<HeatmapProps> = ({ data }) => {
  const sensors = [...new Set(data.map((d) => d.sensor))];
  const timeSlots = [...new Set(data.map((d) => d.time))].sort();

  const getIntensity = (sensor: string, time: string) => {
    const point = data.find((d) => d.sensor === sensor && d.time === time);
    return point ? point.value : 0;
  };

  const isAnomaly = (sensor: string, time: string) => {
    const point = data.find((d) => d.sensor === sensor && d.time === time);
    return point ? point.anomaly : false;
  };

  const getColor = (intensity: number, anomaly: boolean) => {
    if (anomaly) {
      return `rgba(239, 68, 68, ${0.5 + intensity * 0.5})`;
    }
    return `rgba(6, 182, 212, ${intensity * 0.8})`;
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Sensor Activity Heatmap
        </h3>
        <div className="text-sm text-gray-400">Last 24 Hours</div>
      </div>

      <div className="flex-1 bg-gray-900 rounded-lg p-4 overflow-auto">
        <div className="min-w-max">
          <div
            className="grid gap-1 mb-4"
            style={{
              gridTemplateColumns: `60px repeat(${timeSlots.length}, 1fr)`,
            }}
          >
            {/* Header row */}
            <div className="text-xs font-medium text-gray-400 p-2">
              Sensors / Time
            </div>
            {timeSlots.map((time) => (
              <div
                key={time}
                className="text-xs text-gray-400 text-center p-1 min-w-[30px]"
              >
                {time}
              </div>
            ))}

            {/* Data rows */}
            {sensors.map((sensor) => (
              <React.Fragment key={sensor}>
                <div className="text-sm text-gray-300 p-2 flex items-center font-medium bg-gray-800 rounded">
                  {sensor}
                </div>

                {timeSlots.map((time) => {
                  const intensity = getIntensity(sensor, time);
                  const anomaly = isAnomaly(sensor, time);

                  const point = data.find(
                    (d) => d.sensor === sensor && d.time === time
                  );

                  return (
                    <div
                      key={`${sensor}-${time}`}
                      className="aspect-square rounded border border-gray-600 transition-all duration-200 hover:scale-110 hover:z-10 cursor-pointer relative group min-w-[30px] min-h-[30px]"
                      style={{
                        backgroundColor: getColor(intensity, anomaly),
                        boxShadow: anomaly
                          ? "0 0 8px rgba(239, 68, 68, 0.5)"
                          : "none",
                      }}
                    >
                      {/* Eski Tooltip
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20 border border-gray-600">
                        <div className="font-medium">{sensor}</div>
                        <div>Time: {time}</div>
                        <div>Value: {(intensity * 100).toFixed(1)}%</div>
                        {anomaly && <div className="text-red-400">⚠ Anomaly</div>}
                      </div> */}

                      {/* Tooltip */}
                      <div
                        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1
                                      bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100
                                      transition-opacity duration-200 pointer-events-none whitespace-nowrap z-20
                                      border border-gray-600"
                      >
                        <div className="font-medium text-sm mb-1">{sensor}</div>
                        <div>Time: {time}</div>

                        {/* Deviation (z-score) */}
                        {point?.zScore !== undefined && (
                          <div>Deviation: {point.zScore.toFixed(2)}σ</div>
                        )}

                        {/* Intensity */}
                        <div>Intensity: {(intensity * 100).toFixed(1)}%</div>

                        {/* Model flag */}
                        {point?.flag && (
                          <div className="mt-1">
                            Level:
                            <span
                              className={
                                "ml-1 px-1.5 py-0.5 rounded text-[0.7rem] font-semibold " +
                                (point.flag === "critical"
                                  ? "bg-red-500/80 text-red-50"
                                  : point.flag === "warning"
                                  ? "bg-yellow-400/80 text-gray-900"
                                  : "bg-cyan-400/70 text-gray-900")
                              }
                            >
                              {point.flag}
                            </span>
                          </div>
                        )}

                        {/* Critical indicator (matches anomaly) */}
                        {/* {anomaly && <div className="text-red-400">⚠ Critical</div>} */}
                      </div>

                      {/* Anomaly indicator */}
                      {anomaly && (
                        <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Legend */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-cyan-400 opacity-80" />
            <span className="text-sm text-gray-300">Normal Activity</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded bg-red-500 opacity-80 relative">
              <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
            </div>
            <span className="text-sm text-gray-300">Anomaly Detected</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">Intensity:</span>
          <span className="text-xs text-gray-400">Low</span>
          <div className="w-16 h-2 bg-gradient-to-r from-gray-700 via-cyan-600 to-cyan-400 rounded" />
          <span className="text-xs text-gray-400">High</span>
        </div>
      </div>
    </div>
  );
};
