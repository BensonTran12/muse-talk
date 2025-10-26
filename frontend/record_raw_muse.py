import time
import csv
import numpy as np
from brainflow.board_shim import BoardShim, BrainFlowInputParams, BoardIds, BrainFlowError

FS = 256               # Muse 2 sampling rate
DURATION = 10          # seconds to record
OUTPUT_FILE = "raw_muse_data.csv"

def main():
    print("🔌 Connecting to Muse 2 via BrainFlow...")
    params = BrainFlowInputParams()
    params.serial_number = "Muse-2919"  # adjust if yours differs
    board_id = BoardIds.MUSE_2_BOARD.value
    board = BoardShim(board_id, params)

    try:
        board.prepare_session()
        board.start_stream()
        print(f"✅ Muse connected. Recording {DURATION} seconds of data...")

        time.sleep(DURATION)

        print("🧠 Fetching data from buffer...")
        data = board.get_board_data()  # shape = (num_channels, num_samples)
        eeg_channels = BoardShim.get_eeg_channels(board_id)[:4]  # TP9, AF7, AF8, TP10
        eeg_data = data[eeg_channels, :].T  # shape (samples, 4)

        print(f"📈 Collected {eeg_data.shape[0]} samples at {FS} Hz")

        # Save to CSV
        np.savetxt(OUTPUT_FILE, eeg_data, delimiter=",", header="TP9,AF7,AF8,TP10", comments="")
        print(f"💾 Saved EEG data to {OUTPUT_FILE}")

        # Optional: preview some rows
        print("\nFirst 5 samples:")
        print(eeg_data[:5])

    except BrainFlowError as e:
        print(f"❌ BrainFlow error: {e}")
    except KeyboardInterrupt:
        print("🛑 Recording stopped by user.")
    finally:
        try:
            board.stop_stream()
            board.release_session()
        except Exception:
            pass
        print("✅ Session closed cleanly.")

if __name__ == "__main__":
    BoardShim.enable_dev_board_logger()
    main()
