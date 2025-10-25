pip install mne
import numpy as np
import mne
from scipy.signal import butter, filtfilt, iirnotch
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.decomposition import PCA
import numpy as np
# Load the CSV
df = pd.read_csv("combined_data.csv") #add path to whatever file is being used
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
sfreq = 256  # sampling frequency (adjust to your headset)
channel_cols = ['alpha', 'beta', 'theta', 'gamma']
info = mne.create_info(ch_names=channel_cols, sfreq=sfreq, ch_types="eeg")
X_raw = df[channel_cols].to_numpy().T
raw = mne.io.RawArray(X_raw, info)
raw_data = raw.get_data()   # This is a NumPy array of shape (n_channels, n_times)
filtered_data = np.zeros_like(raw_data)
fs = raw.info['sfreq'] 
for i in range(raw_data.shape[0]):
    filtered_data[i, :] = bandpass_filter(raw_data[i, :], 1, 40, fs)
b, a = iirnotch(60, Q=30, fs=fs) #notch filter to remove powerline noise (noise from the device itself)
for i in range(filtered_data.shape[0]):
    filtered_data[i, :] = filtfilt(b, a, filtered_data[i, :])
raw._data = filtered_data
raw.set_eeg_reference('average')
ica = mne.preprocessing.ICA(n_components=4, random_state=97)
ica.fit(raw)
#ica.plot_components()  # optional: view the independent components
ica.exclude = [0, 1]   # manually exclude blink/muscle components
raw = ica.apply(raw)
# After cleaning + ICA
clean_data = raw.get_data().T  # shape: (samples, channels)
# Continue with PCA
pca = PCA(n_components=0.95, random_state=42)
X_compressed = pca.fit_transform(clean_data)
print("Feature shape after compression:", X_compressed.shape)
import pandas as pd
# Turn compressed features into a DataFrame
compressed_df = pd.DataFrame(X_compressed, columns=[f"PC{i+1}" for i in range(X_compressed.shape[1])])
compressed_df["label"] = df["label"].values
# Save to CSV
compressed_df.to_csv("EEG_compressed_data.csv", index=False)
print("✅ Compressed EEG data saved as 'EEG_compressed_data.csv'")
print("File shape:", compressed_df.shape)
