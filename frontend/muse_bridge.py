import os
import sys
import csv
import time
import numpy as np
import pandas as pd
import joblib
import importlib.util
from collections import deque
from scipy.signal import butter, filtfilt, welch
from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds, BrainFlowError

# Ensure live console output
sys.stdout.reconfigure(line_buffering=True)

# --- CONFIG ---
TEMP_CSV = "live_frame.csv"
FS = 128
WINDOW_SECS = 3
SAMPLES_PER_WINDOW = int(FS * WINDOW_SECS)

# --- Locate and load preprocess.py ---
candidate_paths = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "preprocess.py")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "app", "preprocess.py")),
    os.path.abspath(os.path.join(os.getcwd(), "backend", "app", "preprocess.py")),
]

for p in candidate_paths:
    if os.path.exists(p):
        spec = importlib.util.spec_from_file_location("preprocess", p)
        preprocess_mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(preprocess_mod)
        preprocess = preprocess_mod.preprocess
        print(f"✅ Loaded preprocess.py from {p}")
        break
else:
    raise ImportError("❌ Could not locate preprocess.py anywhere.")

# --- Load model bundle ---
MODEL_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "backend", "data", "cache", "bigboy.joblib")
)
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"❌ Model not found at {MODEL_PATH}")

bundle = joblib.load(MODEL_PATH)
if isinstance(bundle, dict):
    model = bundle["model"]
    feature_cols = bundle["features"]
else:
    model = bundle
    feature_cols = getattr(model, "feature_names_in_", [])
print(f"✅ Loaded model with {len(feature_cols)} expected features.")

# --- DSP HELPERS ---
def bandpower(sig, fs, f1, f2):
    """Compute bandpower between f1 and f2 Hz."""
    sig = np.ascontiguousarray(sig.astype(np.float64))
    b, a = butter(4, [f1 / (fs / 2), f2 / (fs / 2)], btype="band")
    filtered = filtfilt(b, a, sig)
    freqs, psd = welch(filtered, fs=fs, nperseg=fs)
    idx = (freqs >= f1) & (freqs <= f2)
    return float(np.trapz(psd[idx], freqs[idx]))

def compute_bandpowers(sig):
    """Compute power in canonical EEG bands."""
    sig = np.nan_to_num(sig)
    bands = {
        "alpha": (8, 12),
        "beta": (13, 30),
        "theta": (4, 7),
        "gamma": (31, 45),
    }
    return {band: bandpower(sig, FS, lo, hi) for band, (lo, hi) in bands.items()}

# --- CONNECTION ---
def start_muse(serial="Muse-2919"):
    """Initialize Muse connection via BrainFlow."""
    params = BrainFlowInputParams()
    params.serial_number = serial
    board = BoardShim(BoardIds.MUSE_2_BOARD.value, params)
    board.prepare_session()
    board.start_stream(45000, "")
    print(f"✅ Muse {serial} connected and streaming...\n")
    return board

# --- MAIN LOOP ---
def main():
    print("🔌 Initializing Muse stream...")
    try:
        board = start_muse()
    except BrainFlowError as e:
        print(f"❌ Muse connection failed: {e}")
        return

    eeg_ch = BoardShim.get_eeg_channels(BoardIds.MUSE_2_BOARD.value)[:4]
    buffer = deque(maxlen=SAMPLES_PER_WINDOW)
    window_idx = 0

    with open(TEMP_CSV, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["window_idx", "alpha", "beta", "theta", "gamma"])

        print("🎧 Collecting EEG frames in real-time...")
        time.sleep(5)

        try:
            while True:
                data = board.get_board_data()
                if data.size == 0:
                    time.sleep(0.05)
                    continue

                channel_data = data[eeg_ch[0], :]
                for sample in channel_data:
                    buffer.append(sample)
                    if len(buffer) == SAMPLES_PER_WINDOW:
                        sig = np.array(buffer).astype(float)
                        bands = compute_bandpowers(sig)

                        writer.writerow([
                            window_idx,
                            bands["alpha"],
                            bands["beta"],
                            bands["theta"],
                            bands["gamma"],
                        ])
                        f.flush()

                        payload = {
                            "alpha": bands["alpha"],
                            "beta": bands["beta"],
                            "theta": bands["theta"],
                            "gamma": bands["gamma"],
                        }

                        print(
                            f"🧩 Frame {window_idx} → "
                            f"α={bands['alpha']:.2f} β={bands['beta']:.2f} "
                            f"θ={bands['theta']:.2f} γ={bands['gamma']:.2f}"
                        )

                        # --- Local preprocess + classify ---
                        df = pd.DataFrame([payload])
                        processed = preprocess(df, aggregate=True, add_features=True)
                        processed = processed.reindex(columns=feature_cols, fill_value=0.0)

                        try:
                            probs = model.predict_proba(processed)[0]
                            labels = model.classes_
                            pred_idx = int(np.argmax(probs))
                            pred_label = labels[pred_idx]
                            conf = probs[pred_idx]
                            print(f"🧠 Classified locally: {pred_label} (Confidence: {conf:.3f})")
                        except Exception as e:
                            print(f"💀 Local classification error: {e}")

                        window_idx += 1
                        buffer.clear()

        except KeyboardInterrupt:
            print("\n🛑 Stopping stream...")
        finally:
            board.stop_stream()
            board.release_session()
            print(f"✅ Muse session closed. Saved {window_idx} frames to {TEMP_CSV}")

# --- ENTRY ---
if __name__ == "__main__":
    main()
