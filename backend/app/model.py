import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from pathlib import Path
from sklearn.preprocessing import StandardScaler

from .config import (
    MODEL_PATH,
    CSV_PATH,
    FEATURE_COLS,
    N_FEATURES,
    WINDOW_SIZE,
    USE_SCALER,
    SCALER_PATH,
    RECOMPUTE_SCALER_FROM_CSV_IF_MISSING,
    LABEL_COL,
    ANOMALY_THRESHOLD,
)


DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


# ============================================================
# 1) VAELSTMv2 mimarisi (notebook ile aynı)
# ============================================================

class VAELSTMv2(nn.Module):
    def __init__(self, input_dim, hidden_dim, latent_dim, num_layers=2, dropout=0.1):
        super(VAELSTMv2, self).__init__()

        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.latent_dim = latent_dim
        self.num_layers = num_layers

        # Encoder LSTM
        self.encoder_lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
        )

        # Latent space parametreleri
        self.fc_mu = nn.Linear(hidden_dim, latent_dim)
        self.fc_logvar = nn.Linear(hidden_dim, latent_dim)

        # Decoder LSTM
        self.decoder_lstm = nn.LSTM(
            input_size=latent_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
        )

        # Çıkış (reconstruction)
        self.fc_out = nn.Linear(hidden_dim, input_dim)

    # ---- Encode, reparam, decode, forward ----
    def encode(self, x):
        # x: (batch, seq_len, input_dim)
        _, (h_n, _) = self.encoder_lstm(x)  # h_n: (num_layers, batch, hidden_dim)
        h_last = h_n[-1]                    # (batch, hidden_dim)

        mu = self.fc_mu(h_last)
        logvar = self.fc_logvar(h_last)
        return mu, logvar

    def reparameterize(self, mu, logvar):
        std = torch.exp(0.5 * logvar)
        eps = torch.randn_like(std)
        return mu + eps * std

    def decode(self, z, seq_len):
        # z: (batch, latent_dim)
        z_seq = z.unsqueeze(1).repeat(1, seq_len, 1)   # (batch, seq_len, latent_dim)
        dec_out, _ = self.decoder_lstm(z_seq)          # (batch, seq_len, hidden_dim)
        recon = self.fc_out(dec_out)                   # (batch, seq_len, input_dim)
        return recon

    def forward(self, x):
        batch_size, seq_len, _ = x.size()
        mu, logvar = self.encode(x)
        z = self.reparameterize(mu, logvar)
        recon = self.decode(z, seq_len)
        return recon, mu, logvar


# ============================================================
# 2) Scaler yükleme / oluşturma
# ============================================================

def load_or_fit_scaler() -> StandardScaler | None:
    if USE_SCALER and SCALER_PATH.exists():
        print(f"[Scaler] Loading from {SCALER_PATH}")
        import joblib
        return joblib.load(SCALER_PATH)

    if USE_SCALER and RECOMPUTE_SCALER_FROM_CSV_IF_MISSING:
        print("[Scaler] Fitting new scaler from CSV…")
        df = pd.read_csv(CSV_PATH)
        if LABEL_COL in df.columns:
            df = df.drop(columns=[LABEL_COL])

        scaler = StandardScaler()
        scaler.fit(df[FEATURE_COLS].values)
        return scaler

    print("[Scaler] Scaler disabled.")
    return None


# ============================================================
# 3) Model state_dict yükleyici
# ============================================================

def load_torch_model(model_path: Path) -> nn.Module:
    if not model_path.exists():
        raise FileNotFoundError(f"Model dosyası bulunamadı: {model_path}")

    print(f"[Model] Loading PyTorch state_dict: {model_path}")
    state = torch.load(model_path, map_location=DEVICE)

    # state_dict bekliyoruz (OrderedDict)
    if not isinstance(state, dict):
        raise TypeError(
            f"Beklenen state_dict (dict/OrderedDict) ama {type(state)} geldi. "
            "Notebook'ta torch.save(model.state_dict(), ...) kullanıldığına emin ol."
        )

    # Hyperparam'ler notebook'tan:
    # hidden_dim = 128, latent_dim = 64, num_layers = 2, dropout = 0.1
    hidden_dim = 128
    latent_dim = 64
    num_layers = 2
    dropout = 0.1

    model = VAELSTMv2(
        input_dim=N_FEATURES,
        hidden_dim=hidden_dim,
        latent_dim=latent_dim,
        num_layers=num_layers,
        dropout=dropout,
    ).to(DEVICE)

    missing, unexpected = model.load_state_dict(state, strict=False)
    if missing:
        print("[Model] Warning: Missing keys in state_dict:", missing)
    if unexpected:
        print("[Model] Warning: Unexpected keys in state_dict:", unexpected)

    model.eval()
    return model


# ============================================================
# 4) Ana inference sınıfı
# ============================================================

class SwatVaeLstmModel:
    def __init__(self):
        self.model = load_torch_model(MODEL_PATH)
        self.scaler = load_or_fit_scaler()

        self.feature_cols = FEATURE_COLS
        self.window_size = WINDOW_SIZE
        self.buffer: list[list[float]] = []

    # ----------------- pencere güncelleme -------------------

    def update_window(self, row: dict):
        x = [float(row[col]) for col in self.feature_cols]
        self.buffer.append(x)
        if len(self.buffer) > self.window_size:
            self.buffer.pop(0)

    def ready(self) -> bool:
        return len(self.buffer) == self.window_size

    # ----------------- inference / anomaly ------------------

    @torch.no_grad()
    def predict(self):
        """
        VAE-LSTM reconstruction error tabanlı anomaly score.
        """
        window = np.array(self.buffer, dtype=np.float32)

        # scaler varsa uygula
        if self.scaler is not None:
            window = self.scaler.transform(window)

        # modele uygun shape: (1, seq_len, input_dim)
        x = torch.tensor(window, dtype=torch.float32, device=DEVICE).unsqueeze(0)

        recon, mu, logvar = self.model(x)

        # reconstruction error (MSE)
        mse = torch.mean((x - recon) ** 2).item()

        anomaly_score = float(mse)
        is_attack = anomaly_score > ANOMALY_THRESHOLD

        return {
            "anomaly_score": anomaly_score,
            "is_attack": is_attack,
        }
