import time
import csv
import numpy as np
from scipy.signal import butter, filtfilt, welch
from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds

FS = 256             # Hz
WIN_SECS = 4         # seconds per window
CONTEXT_SIZE = FS * WIN_SECS
CSV_PATH = "bandpower_windows.csv"

def bandpower(sig, fs, f1, f2):
    """Compute absolute bandpower over [f1, f2]."""
    sig = np.ascontiguousarray(sig.astype(np.float64))
    b, a = butter(4, [f1 / (fs / 2), f2 / (fs / 2)], btype="band")
    filtered = filtfilt(b, a, sig)
    freqs, psd = welch(filtered, fs=fs, nperseg=fs)
    idx = (freqs >= f1) & (freqs <= f2)
    return float(np.trapezoid(psd[idx], freqs[idx]))

def compute_bands(frame):
    """Compute mean bandpowers (theta, alpha, beta, gamma) averaged across channels."""
    frame = np.nan_to_num(frame)
    frame = (frame - frame.mean(axis=0)) / (frame.std(axis=0) + 1e-8)
    bands = {
        "theta": (4, 8),
        "alpha": (8, 13),
        "beta": (13, 30),
        "gamma": (30, 40),
    }
    powers = {}
    for name, (lo, hi) in bands.items():
        ch_powers = [bandpower(frame[:, ch], FS, lo, hi) for ch in range(frame.shape[1])]
        powers[name] = np.mean(ch_powers)
    return powers

def main():
    params = BrainFlowInputParams()
    params.serial_number = "Muse-2919"
    board = BoardShim(BoardIds.MUSE_2_BOARD.value, params)

    board.prepare_session()
    board.start_stream()
    print("✅ Muse connected. Collecting bandpower windows...")

    eeg_ch = BoardShim.get_eeg_channels(BoardIds.MUSE_2_BOARD.value)[:4]

    with open(CSV_PATH, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["window_idx", "alpha", "beta", "theta", "gamma"])

        window_idx = 0
        try:
            while True:
                # Grab ALL available data in buffer
                data = board.get_board_data()
                if data.shape[1] < CONTEXT_SIZE:
                    # not enough samples yet, wait a bit
                    time.sleep(0.5)
                    continue

                frame = data[eeg_ch, -CONTEXT_SIZE:].T
                bands = compute_bands(frame)

                writer.writerow([
                    window_idx,
                    bands["alpha"],
                    bands["beta"],
                    bands["theta"],
                    bands["gamma"],
                ])
                f.flush()

                print(
                    f"🧩 window {window_idx} → "
                    f"α={bands['alpha']:.3f} β={bands['beta']:.3f} "
                    f"θ={bands['theta']:.3f} γ={bands['gamma']:.3f}"
                )
                window_idx += 1
                time.sleep(WIN_SECS)
        except KeyboardInterrupt:
            print("\n🛑 Stopped recording.")
        finally:
            board.stop_stream()
            board.release_session()
            print("✅ Session closed cleanly. CSV saved →", CSV_PATH)

if __name__ == "__main__":
    BoardShim.enable_dev_board_logger()
    main()
