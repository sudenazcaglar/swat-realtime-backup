"""
Replay modülü

Bu modülün görevi:
- SWaT CSV dosyasını okumak
- START_ROW / END_ROW aralığını uygulamak
- Her satır için bir "logical timestamp" üretmek
- main.py içindeki WebSocket döngüsünün kullanabileceği
  bir iterator sağlamak.

Zaman mantığı:
- Eğer TIMESTAMP_COL tanımlı ve USE_SYNTHETIC_TIME = False ise:
    -> CSV'deki timestamp parse edilir (pandas.to_datetime).
- Aksi halde:
    -> SENTETİK zaman kullanılır:
       START_DATETIME + i * STEP_SECONDS
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Dict, Iterator, Tuple, Optional

import pandas as pd

from .config import (
    CSV_PATH,
    LABEL_COL,
    TIMESTAMP_COL,
    USE_SYNTHETIC_TIME,
    START_DATETIME,
    STEP_SECONDS,
    START_ROW,
    END_ROW,
)


# ==========================================
# 1) CSV yükleme ve cache
# ==========================================

_df_cache: Optional[pd.DataFrame] = None


def load_dataframe() -> pd.DataFrame:
    """
    CSV'yi tek seferlik okur ve hafızada tutar.
    START_ROW / END_ROW slice'ını burada uygular.
    """
    global _df_cache
    if _df_cache is not None:
        return _df_cache

    if not CSV_PATH.exists():
        raise FileNotFoundError(f"CSV dosyası bulunamadı: {CSV_PATH}")

    print(f"[Replay] Loading CSV: {CSV_PATH}")
    df = pd.read_csv(CSV_PATH)

    # Etiket kolonunu replay sırasında kullanmıyoruz,
    # ama istersen ileride görmek için bırakmak da mümkün.
    # Şimdilik dataframe'de dursun; row_dict içinde de yer alacak.
    # Eğer hiç görmek istemezsen burada drop edebilirsin:
    # if LABEL_COL in df.columns:
    #     df = df.drop(columns=[LABEL_COL])

    # START_ROW / END_ROW aralığını uygula
    start = START_ROW or 0
    end = END_ROW  # None olabilir, zaten iloc'ta sorun yok

    df = df.iloc[start:end].reset_index(drop=True)

    _df_cache = df
    print(f"[Replay] DataFrame shape after slicing: {df.shape}")
    return _df_cache


# ==========================================
# 2) Timestamp üretimi
# ==========================================

def build_timestamps(df: pd.DataFrame) -> pd.Series:
    """
    DataFrame uzunluğuna göre timestamp serisi üretir.

    - TIMESTAMP_COL tanımlı ve USE_SYNTHETIC_TIME = False ise:
        => df[TIMESTAMP_COL] pandas.to_datetime ile parse edilir.
    - Aksi halde:
        => START_DATETIME'dan başlayıp STEP_SECONDS aralıklı
           sentetik zaman serisi üretilir.
    """
    n = len(df)
    if n == 0:
        raise ValueError("[Replay] DataFrame boş, replay yapacak satır yok.")

    # Gerçek timestamp kolonu kullanılacak mı?
    if (TIMESTAMP_COL is not None) and (not USE_SYNTHETIC_TIME):
        if TIMESTAMP_COL not in df.columns:
            raise KeyError(
                f"[Replay] TIMESTAMP_COL='{TIMESTAMP_COL}' DataFrame kolonları içinde yok."
            )

        ts = pd.to_datetime(df[TIMESTAMP_COL], errors="coerce")

        if ts.isna().any():
            # Eğer parse edilemeyen değerler varsa uyaralım,
            # sentetik zamana fallback yapılmasını isteyebilirsin.
            raise ValueError(
                "[Replay] Timestamp parse edilirken NaN değerler oluştu. "
                "TIMESTAMP_COL formatını kontrol et veya USE_SYNTHETIC_TIME=True yap."
            )

        print(f"[Replay] Using real timestamps from column '{TIMESTAMP_COL}'")
        return ts

    # Sentetik zaman
    print(
        f"[Replay] Using synthetic timestamps from {START_DATETIME.isoformat()} "
        f"step={STEP_SECONDS}s"
    )

    start_dt: datetime = START_DATETIME
    delta = timedelta(seconds=STEP_SECONDS)
    times = [start_dt + i * delta for i in range(n)]
    return pd.Series(times)


# ==========================================
# 3) Ana iterator
# ==========================================

def iter_replay_rows() -> Iterator[Tuple[int, Dict, datetime]]:
    """
    Replay sırasında kullanılacak ana iterator.

    Yields:
        index: int
            0'dan başlayan satır index'i (slice sonrası)
        row_dict: dict
            satırın sözlük hali (kolon adı -> değer)
        ts: datetime
            satır için logical timestamp (gerçek veya sentetik)
    """
    df = load_dataframe()
    ts_series = build_timestamps(df)

    for i, (_, row) in enumerate(df.iterrows()):
        row_dict = row.to_dict()
        ts: datetime = ts_series.iloc[i].to_pydatetime()  # type: ignore

        yield i, row_dict, ts
