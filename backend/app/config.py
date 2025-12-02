from __future__ import annotations

from pathlib import Path
from datetime import datetime

# ==============================
#  Genel yol ayarları
# ==============================

# Bu dosya: backend/app/config.py
# BASE_DIR: backend/ klasörü
BASE_DIR = Path(__file__).resolve().parent.parent

DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"

# Colab'de kullandığın dosya adlarına göre:
CSV_FILENAME = "swat_clean_stage4.csv"
MODEL_FILENAME = "vae_lstm_swat_stage4.pt"

CSV_PATH = DATA_DIR / CSV_FILENAME
MODEL_PATH = MODELS_DIR / MODEL_FILENAME


# ==============================
#  Sensör hata istatistikleri (VAE-LSTM)
# ==============================

# Notebook'ta ürettiğin dosyanın adı:
SENSOR_STATS_FILENAME = "sensor_error_stats_v05.json"

# Bu dosyayı backend/models klasörüne koyduğunu varsayıyoruz
SENSOR_STATS_PATH = MODELS_DIR / SENSOR_STATS_FILENAME

# Z-skor tabanlı seviye threshold'ları
Z_WARNING: float = 2.0    # 2σ üstü = warning
Z_CRITICAL: float = 3.0   # 3σ üstü = critical

# Z-skorunu 0–1 aralığına sıkıştırmak için maks. kabul ettiğimiz sapma
Z_MAX_FOR_INTENSITY: float = 5.0  # 5σ ve üstünü "1.0" kabul et


# ==============================
#  Veri / feature ayarları
# ==============================

# Notebook'ta:
# LABEL_COL = "label"
LABEL_COL = "label"


def infer_feature_cols_from_csv(
    csv_path: Path,
    label_col: str = LABEL_COL,
    sample_rows: int | None = 2000,
) -> list[str]:
    """
    Eğitimde yaptığın gibi:
      1) label kolonunu at
      2) sadece numeric kolonları al
    Böylece backend'de model input'u ile aynı kolonları kullanmış oluyoruz.
    """
    import pandas as pd

    if sample_rows is None:
        df = pd.read_csv(csv_path)
    else:
        df = pd.read_csv(csv_path, nrows=sample_rows)

    assert label_col in df.columns, f"{label_col} kolonu {csv_path.name} içinde bulunamadı!"

    features_all = df.drop(columns=[label_col])
    numeric_cols = features_all.select_dtypes(include=["number"]).columns.tolist()

    if not numeric_cols:
        raise ValueError(
            f"{csv_path.name} içinde numeric feature kolonu bulunamadı. "
            f"Kolon tiplerini kontrol et."
        )

    return numeric_cols


# Eğitimde kullandığın mantıkla numeric feature'ları otomatik çıkar:
FEATURE_COLS: list[str] = infer_feature_cols_from_csv(CSV_PATH, LABEL_COL)
N_FEATURES: int = len(FEATURE_COLS)

# ==============================
#  Sekans / pencere parametreleri
# ==============================

# swat_vae_lstm notebook'unda:
# window_size = 120, stride = 1
WINDOW_SIZE: int = 120
STRIDE: int = 1

# ==============================
#  Skaler (StandardScaler) ayarları
# ==============================

# Notebook'ta StandardScaler kullandın:
# scaler = StandardScaler().fit(X_train)
# X_*_scaled = scaler.transform(...)
#
# İki opsiyon var:
# 1) Colab'de scaler'ı joblib ile kaydedip buradan yüklemek
# 2) Backend açılırken CSV'den yeniden fit etmek (daha kolay demo için)
#
# Şimdilik ikisini de destekleyecek şekilde ayarladım.

USE_SCALER: bool = True

# Eğer Colab'de kaydedersen:
#   joblib.dump(scaler, "scaler_stage4.pkl")
SCALER_FILENAME = "scaler_stage4.pkl"
SCALER_PATH = MODELS_DIR / SCALER_FILENAME

# True: SCALER_PATH yoksa backend açılırken CSV'den yeniden fit et
RECOMPUTE_SCALER_FROM_CSV_IF_MISSING: bool = True

# ==============================
#  Model input normalizasyon ayarları
# ==============================

# Notebook'ta WindowDataset(apply_window_norm=True) kullanıyorsun.
# Backend'de de aynı pipeline'ı uygulamak için bunu True bırak.
# İleride per-window z-score normalizasyonu kapatırsan burayı False yapacaksın.
APPLY_WINDOW_NORM: bool = True

# Per-window z-normalizasyonunda kullanılan küçük epsilon
WINDOW_NORM_EPS: float = 1e-6

# ==============================
#  Anomali skoru / threshold
# ==============================

# Notebook'un son kısmında validation için "best F1" threshold ve
# ayrıca "Recall >= 0.90" threshold'u hesaplıyordun.
#
# Buraya şimdilik bir varsayılan değer koyuyoruz.
# Sen Colab çıktısından "best F1 threshold" veya kullanmak istediğin
# threshold değerini alıp buraya yazabilirsin.
#
# Örnek: ANOMALY_THRESHOLD = 0.65
ANOMALY_THRESHOLD: float = 0.005 #0.40211  # TODO: Notebook'tan seçtiğin değeri buraya yaz

# ==============================
#  Replay (canlı akış simülasyonu) ayarları
# ==============================

# CSV'de gerçek zaman damgası kolonu kullanmak istiyorsan buraya adını yaz:
# Örn: "Timestamp", "DATETIME" vs.
# Eğer temizlenmiş dosyada timestamp yoksa None bırak,
# replay.py sabit adım (STEP_SECONDS) ile sentetik zaman üretsin.
TIMESTAMP_COL: str | None = "timestamp"

# TIMESTAMP_COL = None ise:
USE_SYNTHETIC_TIME: bool = False
START_DATETIME: datetime = datetime(2015, 1, 1, 0, 0, 0)
STEP_SECONDS: float = 1.0  # satırlar arası süre (saniye)

# Replay hızının başlangıç değeri (SpeedControl için)
DEFAULT_SPEED: float = 1.0

# Replay'i datasetin sadece bir bölümünde yapmak istersen:
START_ROW: int = 0
END_ROW: int | None = None  # None => sona kadar
