import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Overview } from './pages/Overview';
import { Control } from './pages/Control';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { NavigationItem } from './types';

function App() {
  const [currentPage, setCurrentPage] = useState<NavigationItem>('overview');

  // Update document title based on current page
  useEffect(() => {
    const titles = {
      overview: 'SWaT Digital Twin - Overview',
      control: 'SWaT Digital Twin - Control',
      logs: 'SWaT Digital Twin - Logs',
      xai: 'SWaT Digital Twin - XAI',
      chat: 'SWaT Digital Twin - Chat',
    };
    
    document.title = titles[currentPage] || 'SWaT Digital Twin';
  }, [currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'overview':
        return <Overview />;
      case 'control':
        return <Control />;
      case 'logs':
        return (
          <PlaceholderPage
            title="System Logs"
            description="This section will contain detailed system logs, audit trails, and historical data analysis for the water treatment plant."
          />
        );
      case 'xai':
        return (
          <PlaceholderPage
            title="Explainable AI"
            description="This section will provide AI model explanations, feature importance analysis, and decision reasoning for anomaly detection."
          />
        );
      case 'chat':
        return (
          <PlaceholderPage
            title="AI Assistant"
            description="This section will feature an intelligent chatbot for interacting with the system, asking questions about plant operations, and getting insights."
          />
        );
      default:
        return <Overview />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default App;