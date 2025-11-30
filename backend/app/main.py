import asyncio
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .model import SwatVaeLstmModel
from .replay import load_dataframe, build_timestamps
from .config import (
    FEATURE_COLS,
    LABEL_COL,
    DEFAULT_SPEED,
)


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # geliştirme için açık dursun
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# PLAYBACK STATE
# ============================================================

class PlaybackState:
    def __init__(self):
        self.speed: float = DEFAULT_SPEED  # 1.0 = normal hız
        self.playing: bool = True          # play/pause
        self.direction: int = 1            # +1: ileri, -1: geri
        self.current_index: int = 0        # hangi satırdayız
        self.jump_requested: bool = False  # jump talebi varsa True
        self.jump_to: int = 0              # jump hedef index

state = PlaybackState()


# ============================================================
# MODEL & DATA LOAD
# ============================================================

# Model tek sefer yüklenecek
model = SwatVaeLstmModel()

# Replay verisi (df ve timestamps tek seferlik yüklenir)
df = load_dataframe()
timestamps = build_timestamps(df)
N = len(df)


# ============================================================
# REST Endpoints (Kontrol API)
# ============================================================

@app.get("/status")
def get_status():
    return {
        "playing": state.playing,
        "speed": state.speed,
        "direction": state.direction,
        "current_index": state.current_index,
        "total_rows": N,
    }


@app.post("/control/play")
def play():
    state.playing = True
    return {"status": "ok", "playing": True}


@app.post("/control/pause")
def pause():
    state.playing = False
    return {"status": "ok", "playing": False}


@app.post("/control/speed/{factor}")
def set_speed(factor: float):
    if factor <= 0:
        factor = 0.1
    elif factor > 20:
        factor = 20.0

    state.speed = factor
    return {"status": "ok", "speed": state.speed}


@app.post("/control/direction/{dir_flag}")
def set_direction(dir_flag: int):
    # 1: ileri, -1: geri
    state.direction = 1 if dir_flag >= 0 else -1
    return {"status": "ok", "direction": state.direction}


@app.post("/control/jump/{index}")
def jump_to_index(index: int):
    if index < 0:
        index = 0
    elif index >= N:
        index = N - 1

    state.jump_requested = True
    state.jump_to = index
    return {"status": "ok", "jump_to": index}


# ============================================================
# WEBSOCKET STREAM
# ============================================================

@app.websocket("/ws/stream")
async def ws_stream(ws: WebSocket):
    await ws.accept()

    # Başlangıç index'i
    state.current_index = 0

    try:
        while True:

            # Pause durumunda bekle
            while not state.playing:
                await asyncio.sleep(0.1)

            # Jump isteği varsa
            if state.jump_requested:
                state.current_index = state.jump_to
                # window'ı sıfırla, model tekrar doldurmaya başlasın
                model.buffer = []
                state.jump_requested = False

            i = state.current_index

            # İleri–geri yönüne göre index güncellemesi
            next_i = i + state.direction

            # Sınır kontrolü
            if next_i < 0:
                next_i = 0
            if next_i >= N:
                next_i = N - 1

            # Timestamp farkına göre bekleme (canlı akış efekti)
            if i > 0:
                dt_real = (timestamps[next_i] - timestamps[i]).total_seconds()
                await asyncio.sleep(max(dt_real / state.speed, 0))

            # Satırı al
            row_dict = df.iloc[i].to_dict()
            ts = timestamps[i]

            # Model pencere güncelle + inference
            model.update_window(row_dict)
            prediction = model.predict() if model.ready() else None

            # UI’ya gönderilecek mesaj
            msg = {
                "index": i,
                "timestamp": ts.isoformat(),
                "sensors": {c: float(row_dict[c]) for c in FEATURE_COLS},
                "label": row_dict[LABEL_COL] if LABEL_COL in row_dict else None,
                "prediction": prediction,
            }

            await ws.send_json(msg)

            # Bir sonraki adıma ilerle
            state.current_index = next_i

    except WebSocketDisconnect:
        print("Client disconnected.")
    except Exception as e:
        print("WebSocket error:", e)
        # Starlette zaten kapatıyor, ekstra close çağrısına gerek yok
        # await ws.close()