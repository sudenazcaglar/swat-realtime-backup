import React from "react";
import {
  LayoutDashboard,
  Settings,
  FileText,
  Brain,
  MessageSquare,
  Activity,
} from "lucide-react";
import { NavigationItem } from "../types";

interface LayoutProps {
  children: React.ReactNode;
  currentPage: NavigationItem;
  onNavigate: (page: NavigationItem) => void;
  timeLabel?: string; // replay timestamp buradan gelecek
}

const navItems: { id: NavigationItem; icon: React.ElementType; label: string }[] =
  [
    { id: "overview", icon: LayoutDashboard, label: "Overview" },
    { id: "control", icon: Activity, label: "Control" },
    { id: "logs", icon: FileText, label: "Logs" },
    { id: "xai", icon: Brain, label: "XAI" },
    { id: "chat", icon: MessageSquare, label: "Chat" },
  ];

const pageTitles: Record<NavigationItem, string> = {
  overview: "SWaT Digital Twin – Anomaly Detection",
  control: "SWaT Digital Twin – Control",
  logs: "SWaT Digital Twin – Logs",
  xai: "SWaT Digital Twin – Explainability",
  chat: "SWaT Digital Twin – Chat",
};

export const Layout: React.FC<LayoutProps> = ({
  children,
  currentPage,
  onNavigate,
  timeLabel,
}) => {
  // Eğer üstten replay zamanı gelmemişse, yedek olarak gerçek saati göster
  const fallbackTime = new Date().toLocaleTimeString();
  const displayTime = timeLabel ?? fallbackTime;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-20 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-6">
        <div className="mb-8">
          <Activity className="w-8 h-8 text-cyan-400" />
        </div>

        <div className="flex-1 flex flex-col items-center space-y-4 mt-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${
                  isActive
                    ? "bg-cyan-600 text-white"
                    : "text-gray-400 hover:bg-gray-700 hover:text-white"
                }`}
                title={item.label}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>

        <button className="w-10 h-10 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-gray-700 hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-16 border-b border-gray-800 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-semibold">
              {pageTitles[currentPage]}
            </h1>
          </div>

          <div className="flex items-center space-x-6">
            {/* İŞTE BURASI: eskiden gerçek saat vardı, şimdi replay timeLabel burada */}
            <span className="text-sm text-gray-300">{displayTime}</span>

            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300">Live</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};
