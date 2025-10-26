import csv, time, random, os
import numpy as np
from collections import deque
from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds
from brainflow.data_filter import DataFilter, FilterTypes, WindowOperations
from scipy.signal import butter, filtfilt, welch

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def show(msg):
    clear_screen()
    print("\n\n\n")
    print(" " * 25 + msg)
    print("\n\n\n")

def bandpower(sig, fs, f1, f2):
    sig = np.ascontiguousarray(sig.astype(np.float64))
    b, a = butter(4, [f1/(fs/2), f2/(fs/2)], btype='band')
    filtered = filtfilt(b, a, sig)
    freqs, psd = welch(filtered, fs=fs, nperseg=fs)
    idx = np.logical_and(freqs >= f1, freqs <= f2)
    return float(np.trapz(psd[idx], freqs[idx]))

params = BrainFlowInputParams()
params.serial_number = "Muse-2919"
board_id = BoardIds.MUSE_2_BOARD.value
board = BoardShim(board_id, params)

print("\n Connecting to Muse 2...")
board.prepare_session()
board.start_stream()
time.sleep(3)

fs = BoardShim.get_sampling_rate(board_id)
eeg_ch = BoardShim.get_eeg_channels(board_id)[0]
print(" Muse connected & streaming!")

filename = "eeg_training_data_temporal.csv"
file_exists = os.path.isfile(filename)

# open file first time
f = open(filename, "a", newline="")
writer = csv.writer(f)

# write header if needed
if not file_exists or os.path.getsize(filename) == 0:
    writer.writerow(["attempt_id", "label", "window_idx", "alpha", "beta", "theta", "gamma"])

labels = ["left", "right", "up", "down"]

samples_per_window = int(fs * 1)  # 1 second windows
imagery_time = 4

# Keep attempt numbering consistent across sessions (safe version)
attempt_id = 0
if os.path.exists(filename) and os.path.getsize(filename) > 0:
    with open(filename, "r") as fr:
        reader = csv.DictReader(fr)
        ids = []
        for row in reader:
            try:
                ids.append(int(row["attempt_id"]))
            except:
                pass
        if ids:
            attempt_id = max(ids)

print("\n🎬 EEG Training Ready")
print("Press CTRL+C to quit anytime.\n")

try:
    while True:
        label = random.choice(labels)
        attempt_id += 1

        # fixation cross while waiting for user
        show("+")
        input(f"Attempt {attempt_id} — press ENTER when focused on the cross...")

        # Fixation (1s)
        show("+")
        time.sleep(1)

        # Cue (1s)
        arrow_map = {"left": "←", "right": "→", "up": "↑", "down": "↓"}
        show(arrow_map[label])
        time.sleep(1)

        # Imagery (recording)
        show("")
        start = time.time()
        window_idx = 0

        while time.time() - start < imagery_time:
            data = board.get_current_board_data(samples_per_window)
            if data.shape[1] < samples_per_window:
                continue

            sig = data[eeg_ch, :]
            alpha = bandpower(sig, fs, 8, 12)
            beta = bandpower(sig, fs, 13, 30)
            theta = bandpower(sig, fs, 4, 7)
            gamma = bandpower(sig, fs, 31, 45)

            writer.writerow([attempt_id, label, window_idx, alpha, beta, theta, gamma])
            window_idx += 1

        # Rest (3s)
        show("")
        time.sleep(3)

        print(f"✅ Trial {attempt_id} saved | Label: {label} | Windows: {window_idx}")

        # Ask user if they want to delete this attempt
        keep = input(f"Keep this attempt ({attempt_id})? (y/n): ").strip().lower()
        if keep == "n":
            print(f" Deleting attempt {attempt_id}...")

            f.close()

            # Recreate CSV without this attempt
            with open(filename, "r") as fr:
                reader = csv.DictReader(fr)
                rows = [r for r in reader if r.get("attempt_id") and int(r["attempt_id"]) != attempt_id]

            with open(filename, "w", newline="") as fw:
                writer_new = csv.DictWriter(
                    fw,
                    fieldnames=["attempt_id", "label", "window_idx", "alpha", "beta", "theta", "gamma"]
                )
                writer_new.writeheader()
                for r in rows:
                    writer_new.writerow(r)

            # reopen file for appending
            f = open(filename, "a", newline="")
            writer = csv.writer(f)

            attempt_id -= 1
            print("✅ Attempt deleted. ID rolled back.")
        else:
            print(" Keeping attempt.")

except KeyboardInterrupt:
    show("STOPPING...")

finally:
    board.stop_stream()
    board.release_session()
    f.close()
    show(" DONE — Data saved!")
    print(f"Data saved to {filename}")

import csv, time, random, os
import numpy as np
from collections import deque
from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds
from brainflow.data_filter import DataFilter, FilterTypes, WindowOperations
from scipy.signal import butter, filtfilt, welch

def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def show(msg):
    clear_screen()
    print("\n\n\n")
    print(" " * 25 + msg)
    print("\n\n\n")

def bandpower(sig, fs, f1, f2):
    sig = np.ascontiguousarray(sig.astype(np.float64))
    b, a = butter(4, [f1/(fs/2), f2/(fs/2)], btype='band')
    filtered = filtfilt(b, a, sig)
    freqs, psd = welch(filtered, fs=fs, nperseg=fs)
    idx = np.logical_and(freqs >= f1, freqs <= f2)
    return float(np.trapz(psd[idx], freqs[idx]))

params = BrainFlowInputParams()
params.serial_number = "Muse-2919"
board_id = BoardIds.MUSE_2_BOARD.value
board = BoardShim(board_id, params)

print("\n Connecting to Muse 2...")
board.prepare_session()
board.start_stream()
time.sleep(3)

fs = BoardShim.get_sampling_rate(board_id)
eeg_ch = BoardShim.get_eeg_channels(board_id)[0]
print(" Muse connected & streaming!")

filename = "eeg_training_data_temporal.csv"
file_exists = os.path.isfile(filename)

# open file first time
f = open(filename, "a", newline="")
writer = csv.writer(f)

# write header if needed
if not file_exists or os.path.getsize(filename) == 0:
    writer.writerow(["attempt_id", "label", "window_idx", "alpha", "beta", "theta", "gamma"])

labels = ["left", "right", "up", "down"]

samples_per_window = int(fs * 1)  # 1 second windows
imagery_time = 4

# Keep attempt numbering consistent across sessions (safe version)
attempt_id = 0
if os.path.exists(filename) and os.path.getsize(filename) > 0:
    with open(filename, "r") as fr:
        reader = csv.DictReader(fr)
        ids = []
        for row in reader:
            try:
                ids.append(int(row["attempt_id"]))
            except:
                pass
        if ids:
            attempt_id = max(ids)

print("\n🎬 EEG Training Ready")
print("Press CTRL+C to quit anytime.\n")

try:
    while True:
        label = random.choice(labels)
        attempt_id += 1

        # fixation cross while waiting for user
        show("+")
        input(f"Attempt {attempt_id} — press ENTER when focused on the cross...")

        # Fixation (1s)
        show("+")
        time.sleep(1)

        # Cue (1s)
        arrow_map = {"left": "←", "right": "→", "up": "↑", "down": "↓"}
        show(arrow_map[label])
        time.sleep(1)

        # Imagery (recording)
        show("")
        start = time.time()
        window_idx = 0

        while time.time() - start < imagery_time:
            data = board.get_current_board_data(samples_per_window)
            if data.shape[1] < samples_per_window:
                continue

            sig = data[eeg_ch, :]
            alpha = bandpower(sig, fs, 8, 12)
            beta = bandpower(sig, fs, 13, 30)
            theta = bandpower(sig, fs, 4, 7)
            gamma = bandpower(sig, fs, 31, 45)

            writer.writerow([attempt_id, label, window_idx, alpha, beta, theta, gamma])
            window_idx += 1

        # Rest (3s)
        show("")
        time.sleep(3)

        print(f"✅ Trial {attempt_id} saved | Label: {label} | Windows: {window_idx}")

        # Ask user if they want to delete this attempt
        keep = input(f"Keep this attempt ({attempt_id})? (y/n): ").strip().lower()
        if keep == "n":
            print(f" Deleting attempt {attempt_id}...")

            f.close()

            # Recreate CSV without this attempt
            with open(filename, "r") as fr:
                reader = csv.DictReader(fr)
                rows = [r for r in reader if r.get("attempt_id") and int(r["attempt_id"]) != attempt_id]

            with open(filename, "w", newline="") as fw:
                writer_new = csv.DictWriter(
                    fw,
                    fieldnames=["attempt_id", "label", "window_idx", "alpha", "beta", "theta", "gamma"]
                )
                writer_new.writeheader()
                for r in rows:
                    writer_new.writerow(r)

            # reopen file for appending
            f = open(filename, "a", newline="")
            writer = csv.writer(f)

            attempt_id -= 1
            print("✅ Attempt deleted. ID rolled back.")
        else:
            print(" Keeping attempt.")

except KeyboardInterrupt:
    show("STOPPING...")

finally:
    board.stop_stream()
    board.release_session()
    f.close()
    show(" DONE — Data saved!")
    print(f"Data saved to {filename}")
