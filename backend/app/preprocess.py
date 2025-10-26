import numpy as np
import mne
from scipy.signal import butter, filtfilt, iirnotch
from sklearn.preprocessing import LabelEncoder
from sklearn.decomposition import PCA
import pandas as pd


def preprocess_csv(csv_path: str = "combined_data.csv"):
    try:
        df = pd.read_csv(csv_path)
    except FileNotFoundError:
        print(f"[Warning] No file found at {csv_path}, skipping preprocessing.")
        return None

    X = df[["alpha", "beta", "theta", "gamma"]].values
    y = LabelEncoder().fit_transform(df["label"])
    print("✅ Data loaded successfully")
    print("Feature shape before compression:", X.shape)

    def bandpass_filter(data, lowcut, highcut, fs, order=5):
        nyq = 0.5 * fs
        low = lowcut / nyq
        high = highcut / nyq
        b, a = butter(order, [low, high], btype='band')
        return filtfilt(b, a, data)

    sfreq = 256
    channel_cols = ['alpha', 'beta', 'theta', 'gamma']
    info = mne.create_info(ch_names=channel_cols, sfreq=sfreq, ch_types="eeg")

    X_raw = df[channel_cols].to_numpy().T
    raw = mne.io.RawArray(X_raw, info)

    filtered_data = np.zeros_like(raw.get_data())
    fs = raw.info['sfreq']
    for i in range(filtered_data.shape[0]):
        filtered_data[i, :] = bandpass_filter(raw._data[i, :], 1, 40, fs)

    b, a = iirnotch(60, Q=30, fs=fs)
    for i in range(filtered_data.shape[0]):
        filtered_data[i, :] = filtfilt(b, a, filtered_data[i, :])

    raw._data = filtered_data
    raw.set_eeg_reference('average')

    ica = mne.preprocessing.ICA(n_components=4, random_state=97)
    ica.fit(raw)
    ica.exclude = [0, 1]
    raw = ica.apply(raw)

    clean_data = raw.get_data().T
    pca = PCA(n_components=0.95, random_state=42)
    X_compressed = pca.fit_transform(clean_data)

    print("Feature shape after compression:", X_compressed.shape)

    compressed_df = pd.DataFrame(X_compressed, columns=[f"PC{i+1}" for i in range(X_compressed.shape[1])])
    compressed_df["label"] = df["label"].values
    compressed_df.to_csv("EEG_compressed_data.csv", index=False)

    print("✅ Compressed EEG data saved as 'EEG_compressed_data.csv'")
    print("File shape:", compressed_df.shape)

    return compressed_df
