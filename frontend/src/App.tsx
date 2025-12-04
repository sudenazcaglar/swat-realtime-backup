import { useEffect, useState } from "react";
import { Layout } from "./components/Layout";
import { Overview } from "./pages/Overview";
import { Control } from "./pages/Control";
import { HeatmapPage } from "./pages/HeatmapPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { NavigationItem } from "./types";

function App() {
  const [currentPage, setCurrentPage] = useState<NavigationItem>("overview");
  const [replayTimeLabel, setReplayTimeLabel] = useState<string | undefined>();

  // Sayfa başlığını güncelle
  useEffect(() => {
    const titles: Record<NavigationItem, string> = {
      overview: "SWaT Digital Twin - Overview",
      control: "SWaT Digital Twin - Control",
      logs: "SWaT Digital Twin - Logs",
      xai: "SWaT Digital Twin - XAI",
      chat: "SWaT Digital Twin - Chat",
    };

    document.title = titles[currentPage] ?? "SWaT Digital Twin";
  }, [currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case "overview":
        return <Overview onTimeLabelChange={setReplayTimeLabel} />;

      case "control":
        return <Control />;

      case "logs":
        return (
          <PlaceholderPage
            title="Logs"
            description="Log ekranı henüz implement edilmedi. Burada sistem olay kayıtları ve geçmiş anomaliler gösterilecek."
          />
        );

      case "xai":
        return (
          <HeatmapPage />);

      case "chat":
        return (
          <PlaceholderPage
            title="Chat"
            description="Chat ekranı henüz implement edilmedi. Burada operatör ile etkileşimli sohbet arayüzü yer alacak."
          />
        );

      default:
        return <Overview onTimeLabelChange={setReplayTimeLabel} />;
    }
  };

  return (
    <Layout
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      timeLabel={replayTimeLabel}
    >
      {renderPage()}
    </Layout>
  );
}

export default App;
