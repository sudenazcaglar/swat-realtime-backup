import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import { useSwatRealtimeData } from "../hooks/useSwatRealtimeData";

// Hook'un döndürdüğü state tipi
type RealtimeCoreState = ReturnType<typeof useSwatRealtimeData>;

// Context'in dışarı verdiği tip:
// - useSwatRealtimeData'dan dönen her şey
// - playbackSpeed'i değiştirmek için bir setter
type SwatRealtimeState = RealtimeCoreState & {
  setPlaybackSpeed: (speed: number) => void;
};

const SwatRealtimeContext = createContext<SwatRealtimeState | undefined>(
  undefined
);

export const SwatRealtimeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Tek bir yerde global playbackSpeed tutuyoruz
  const [playbackSpeed, setPlaybackSpeed] = useState(0);

  // WebSocket + replay mantığı burada BİR KEZ çalışıyor
  const coreState = useSwatRealtimeData(playbackSpeed);

  const value: SwatRealtimeState = {
    ...coreState,
    setPlaybackSpeed,
  };

  return (
    <SwatRealtimeContext.Provider value={value}>
      {children}
    </SwatRealtimeContext.Provider>
  );
};

export const useSwatRealtime = (): SwatRealtimeState => {
  const ctx = useContext(SwatRealtimeContext);
  if (!ctx) {
    throw new Error(
      "useSwatRealtime sadece SwatRealtimeProvider içinde kullanılabilir."
    );
  }
  return ctx;
};
