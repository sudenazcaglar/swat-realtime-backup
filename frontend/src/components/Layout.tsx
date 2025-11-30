import React from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  FileText, 
  Brain, 
  MessageSquare,
  Activity
} from 'lucide-react';
import { NavigationItem } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: NavigationItem;
  onNavigate: (page: NavigationItem) => void;
}

const navigationItems = [
  { id: 'overview' as NavigationItem, icon: LayoutDashboard, label: 'Overview' },
  { id: 'control' as NavigationItem, icon: Settings, label: 'Control' },
  { id: 'logs' as NavigationItem, icon: FileText, label: 'Logs' },
  { id: 'xai' as NavigationItem, icon: Brain, label: 'XAI' },
  { id: 'chat' as NavigationItem, icon: MessageSquare, label: 'Chat' },
];

export const Layout: React.FC<LayoutProps> = ({ children, currentPage, onNavigate }) => {
  const currentTime = new Date().toLocaleTimeString();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      {/* Sidebar */}
      <div className="w-20 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-6">
        <div className="mb-8">
          <Activity className="w-8 h-8 text-cyan-400" />
        </div>
        
        <nav className="flex flex-col space-y-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`p-3 rounded-lg transition-all duration-200 group relative ${
                  isActive 
                    ? 'bg-cyan-600 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
                title={item.label}
              >
                <Icon className="w-6 h-6" />
                
                {/* Tooltip */}
                <div className="absolute left-full ml-3 px-2 py-1 bg-gray-800 text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                  {item.label}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-white">
            SWaT Digital Twin – Anomaly Detection
          </h1>
          
          <div className="flex items-center space-x-6">
            <div className="text-gray-300">
              {currentTime}
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300">Live</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};