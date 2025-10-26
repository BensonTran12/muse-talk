import csv, time, os
import numpy as np
from collections import deque
from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds
from scipy.signal import butter, filtfilt, welch

# Compute bandpower for specific frequency ranges
def bandpower(sig, fs, f1, f2):
    sig = np.ascontiguousarray(sig.astype(np.float64))
    b, a = butter(4, [f1/(fs/2), f2/(fs/2)], btype='band')
    filtered = filtfilt(b, a, sig)
    freqs, psd = welch(filtered, fs=fs, nperseg=fs)
    idx = np.logical_and(freqs >= f1, freqs <= f2)
    return float(np.trapz(psd[idx], freqs[idx]))

# --- Connect to Muse 2 ---
params = BrainFlowInputParams()
params.serial_number = "Muse-2919"  # ✅ Your specific serial number
board_id = BoardIds.MUSE_2_BOARD.value
board = BoardShim(board_id, params)

print("\n🧠 Connecting to Muse 2...")
board.prepare_session()
board.start_stream()
time.sleep(5)  # Allow buffer to fill before acquisition
fs = BoardShim.get_sampling_rate(board_id)
eeg_ch = BoardShim.get_eeg_channels(board_id)[0]
print("✅ Muse connected and streaming!\n")

# --- CSV Setup ---
filename = "eeg_training_data_temporal.csv"
file_is_new = not os.path.exists(filename) or os.path.getsize(filename) == 0

with open(filename, "a", newline="") as f:
    writer = csv.writer(f)

    if file_is_new:
        writer.writerow(["attempt_id","label","window_idx","alpha","beta","theta","gamma"])

    # Parameters for windowing and attempts
    directions = ["left", "right", "up", "down"]
    window_duration = 3
    samples_per_window = int(window_duration * fs)
    record_time = 6  # seconds per attempt
    buffer = deque(maxlen=samples_per_window)
    attempt_id = 0

    while True:
        print("\nAvailable directions:", directions)
        choice = input("Pick a direction or 'q' to quit: ").strip().lower()

        if choice == "q":
            break
        if choice not in directions:
            print("❌ Invalid input.")
            continue

        attempt_id += 1
        window_idx = 0
        print(f"\n🎯 ATTEMPT {attempt_id}: Think {choice.upper()} for {record_time} seconds")

        start = time.time()
        while True:
            data = board.get_board_data()
            if data.size == 0:
                time.sleep(0.05)
                if time.time() - start >= record_time:
                    break
                continue

            channel_data = data[eeg_ch, :]
            for sample in channel_data:

                # ✅ Stop cleanly inside loop
                if time.time() - start >= record_time:
                    break

                buffer.append(sample)

                if len(buffer) == samples_per_window:
                    sig = np.array(buffer).astype(float)
                    alpha = bandpower(sig, fs, 8, 12)
                    beta  = bandpower(sig, fs, 13, 30)
                    theta = bandpower(sig, fs, 4, 7)
                    gamma = bandpower(sig, fs, 31, 45)

                    writer.writerow([attempt_id, choice, window_idx,
                                     alpha, beta, theta, gamma])

                    print(f"{choice}[{attempt_id}-{window_idx}] → α={alpha:.2f} β={beta:.2f} θ={theta:.2f} γ={gamma:.2f}")
                    window_idx += 1

            if time.time() - start >= record_time:
                break

print("\n🛑 Stopping stream...")
board.stop_stream()
board.release_session()
print(f"✅ Data saved to {filename}\n")