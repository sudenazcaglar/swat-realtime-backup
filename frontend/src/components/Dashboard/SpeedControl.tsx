import React from "react";
import { Play, Pause, RotateCcw, Rewind } from "lucide-react";

interface SpeedControlProps {
  speed: number;
  onSpeedChange: (speed: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onRewind: () => void;
}

const getRewindLabel = (speed: number): string => {
  if (speed === 0.5) return "30 sn geriye sar";
  if (speed === 1) return "1 dk geriye sar";
  if (speed === 2) return "2 dk geriye sar";
  if (speed === 5) return "5 dk geriye sar";
  if (speed === 10) return "10 dk geriye sar";
  return "Geri sar";
};

export const SpeedControl: React.FC<SpeedControlProps> = ({
  speed,
  onSpeedChange,
  isPlaying,
  onPlayPause,
  onReset,
  onRewind,
}) => {
  const speeds = [0.5, 1, 2, 5, 10];

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-300">Replay Control</h4>

        <div className="flex items-center space-x-3">
          {/* Rewind */}
          <button
            onClick={onRewind}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors duration-200"
            title={getRewindLabel(speed)}
          >
            <Rewind className="w-4 h-4 text-gray-300" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={onPlayPause}
            className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors duration-200"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white" />
            )}
          </button>

          {/* Reset to beginning */}
          <button
            onClick={onReset}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors duration-200"
            title="Baştan oynat"
          >
            <RotateCcw className="w-4 h-4 text-gray-300" />
          </button>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">Speed:</span>
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200 ${
                speed === s
                  ? "bg-cyan-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
