import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  Grid3x3,
  Activity,
  Settings,
} from "lucide-react";
import { NavigationItem } from "../types";
import { SpeedControl } from "./Dashboard/SpeedControl";
import { useSwatRealtime } from "../context/SwatRealtimeContext";

interface LayoutProps {
  children: React.ReactNode;
  currentPage: NavigationItem;
  onNavigate: (page: NavigationItem) => void;
}

// ✅ Settings'i de navItems gibi render edeceğiz (ama sayfa değil, action)
type NavItem = {
  id: NavigationItem | "settings";
  icon: React.ElementType;
  label: string;
  kind: "page" | "action";
};

const navItems: NavItem[] = [
  { id: "overview", icon: LayoutDashboard, label: "Overview", kind: "page" },
  { id: "control", icon: Activity, label: "Control", kind: "page" },
  { id: "logs", icon: FileText, label: "Logs", kind: "page" },
  { id: "xai", icon: Grid3x3, label: "XAI", kind: "page" },
  // ✅ Settings artık burada ve diğerleri gibi render edilecek
  { id: "settings", icon: Settings, label: "Settings", kind: "action" },
];

const API_BASE =
  (import.meta as any).env?.VITE_BACKEND_HTTP_URL ?? "http://localhost:8000";

const pageTitles: Record<NavigationItem, string> = {
  overview: "SWaT Digital Twin – Anomaly Detection",
  control: "SWaT Digital Twin – Control",
  logs: "SWaT Digital Twin – Logs",
  xai: "SWaT Digital Twin – Explainability",
};

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentPage,
  onNavigate,
}) => {
  const { currentTimestamp } = useSwatRealtime();

  const [settingsOpen, setSettingsOpen] = useState(false);

  // Replay control state (global, tüm sayfalarda geçerli)
  const [speed, setSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);

  const { setPlaybackSpeed } = useSwatRealtime();

  // isPlaying / speed değiştikçe global playbackSpeed'i güncelle
  useEffect(() => {
    setPlaybackSpeed(isPlaying ? speed : 0);
  }, [isPlaying, speed, setPlaybackSpeed]);

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
    if (wasPaused) setIsPlaying(true);

    try {
      await fetch(`${API_BASE}/control/speed/${newSpeed}`, { method: "POST" });

      if (wasPaused) {
        await fetch(`${API_BASE}/control/play`, { method: "POST" });
      }
    } catch (err) {
      console.error("[ReplayControl] speed change error", err);
    }
  };

  const handleReset = async () => {
    try {
      await fetch(`${API_BASE}/control/jump/0`, { method: "POST" });

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
      const res = await fetch(`${API_BASE}/status`);
      const status = await res.json();
      const currentIndex: number = status.current_index ?? 0;

      let backSeconds: number;
      if (speed === 0.5) backSeconds = 30;
      else if (speed === 1) backSeconds = 60;
      else if (speed === 2) backSeconds = 120;
      else if (speed === 5) backSeconds = 300;
      else if (speed === 10) backSeconds = 600;
      else backSeconds = 60;

      const newIndex = Math.max(currentIndex - backSeconds, 0);

      await fetch(`${API_BASE}/control/jump/${newIndex}`, { method: "POST" });

      if (!isPlaying) {
        setIsPlaying(true);
        await fetch(`${API_BASE}/control/play`, { method: "POST" });
      }
    } catch (err) {
      console.error("[ReplayControl] rewind error", err);
    }
  };

  // Overview'deki formatTimestamp ile birebir aynı format
  const displayTime =
    currentTimestamp != null
      ? new Date(currentTimestamp).toLocaleString("en-US", {
          year: "numeric",
          month: "long",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : new Date().toLocaleString("en-US", {
          year: "numeric",
          month: "long",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-20 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-4">
        <div className="mb-8">
          <Activity className="w-8 h-8 text-cyan-400" />
        </div>

        {/* ✅ Settings dahil tüm ikonlar aynı map ile render ediliyor */}
        <div className="flex flex-col items-center space-y-5 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.id === "settings" ? settingsOpen : currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.kind === "action" && item.id === "settings") {
                    setSettingsOpen(true);
                    return;
                  }
                  // page
                  onNavigate(item.id as NavigationItem);
                }}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${
                  isActive
                    ? "bg-cyan-600 text-white"
                    : "text-gray-400 hover:bg-gray-700 hover:text-white"
                }`}
                title={item.label}
              >
                <Icon className="w-6 h-6" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-16 border-b border-gray-800 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-semibold">{pageTitles[currentPage]}</h1>
          </div>

          <div className="flex items-center space-x-6">
            <span className="text-sm text-gray-300">{displayTime}</span>

            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300">Live</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}

          {/* Settings Drawer */}
          <div
            className={`fixed inset-0 z-40 ${
              settingsOpen ? "" : "pointer-events-none"
            }`}
            aria-hidden={!settingsOpen}
          >
            {/* Backdrop */}
            <div
              className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
                settingsOpen ? "opacity-100" : "opacity-0"
              }`}
              onClick={() => setSettingsOpen(false)}
            />

            {/* Panel */}
            <aside
              className={`absolute top-0 right-0 h-full w-[360px] max-w-[90vw] bg-gray-900 border-l border-gray-700 shadow-2xl transform transition-transform duration-200 ${
                settingsOpen ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <div className="p-4 flex items-center justify-between border-b border-gray-700">
                <div className="text-white font-semibold">Settings</div>
                <button
                  onClick={() => setSettingsOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Close settings"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div className="text-sm text-gray-300 font-medium">
                  Replay Control
                </div>
                <SpeedControl
                  speed={speed}
                  onSpeedChange={handleSpeedChange}
                  isPlaying={isPlaying}
                  onPlayPause={handlePlayPause}
                  onReset={handleReset}
                  onRewind={handleRewind}
                />
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
};
