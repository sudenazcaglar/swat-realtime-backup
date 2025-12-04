export interface SensorData {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: number[];
  status: "normal" | "warning" | "critical";
}

export interface PlantComponent {
  id: string;
  type: "tank" | "pump" | "valve" | "pipe";
  name: string;
  status: "active" | "inactive" | "fault";
  value?: number;
  position?: { x: number; y: number };
}

export interface AnomalyEvent {
  id: string;
  timestamp: Date;
  severity: "low" | "medium" | "high";
  message: string;
  sensor: string;
  value?: number;
}

// export interface HeatmapData {
//   sensor: string;
//   time: string;
//   value: number;
//   anomaly: boolean;
// }

export interface HeatmapData {
  sensor: string;
  time: string;

  // 0–1 arası intensity (z-score'dan türetilmiş)
  value: number;

  // o anda bu sensör critical mi?
  anomaly: boolean;

  // 🔽 yeni alanlar (modelden)
  zScore?: number; // kaç σ
  flag?: "normal" | "warning" | "critical"; // seviye
}

export type NavigationItem = "overview" | "control" | "logs" | "xai" | "chat";
