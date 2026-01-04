import { useEffect, useState } from "react";
import { Layout } from "./components/Layout";
import { Overview } from "./pages/Overview";
import { Control } from "./pages/Control";
import { HeatmapPage } from "./pages/HeatmapPage";
import { NavigationItem } from "./types";
import { SwatRealtimeProvider } from "./context/SwatRealtimeContext.tsx";
import { Logs } from "./pages/Logs";

function App() {
  const [currentPage, setCurrentPage] = useState<NavigationItem>("overview");
  // const [replayTimeLabel, setReplayTimeLabel] = useState<string | undefined>();

  // Sayfa başlığını güncelle
  useEffect(() => {
    const titles: Record<NavigationItem, string> = {
      overview: "SWaT Digital Twin - Overview",
      control: "SWaT Digital Twin - Control",
      logs: "SWaT Digital Twin - Logs",
      xai: "SWaT Digital Twin - XAI",
    };

    document.title = titles[currentPage] ?? "SWaT Digital Twin";
  }, [currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case "overview":
        return <Overview />;

      case "control":
        return <Control />;

      case "logs":
        return <Logs />;

      case "xai":
        return <HeatmapPage />;

      default:
        return <Overview />;
    }
  };

  return (
    <SwatRealtimeProvider>
      <Layout
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        // timeLabel={replayTimeLabel}
      >
        {renderPage()}
      </Layout>
    </SwatRealtimeProvider>
  );
}

export default App;
