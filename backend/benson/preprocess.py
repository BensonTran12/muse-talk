import numpy as np
import mne
from scipy.signal import butter, filtfilt, iirnotch
from sklearn.preprocessing import LabelEncoder
from sklearn.decomposition import PCA
from mne.preprocessing import ICA


def bandpass_filter(data, lowcut, highcut, fs, order=5):
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    b, a = butter(order, [low, high], btype='band')
    return filtfilt(b, a, data)


def apply_notch_filter(raw, notch_freq=60, Q=30, ref_type='average'):
    fs = raw.info['sfreq']
    filtered_data = raw.get_data().copy()
    b, a = iirnotch(notch_freq, Q=Q, fs=fs)
    for i in range(filtered_data.shape[0]):
        filtered_data[i, :] = filtfilt(b, a, filtered_data[i, :])
    raw._data = filtered_data
    raw.set_eeg_reference(ref_type)
    return raw


def apply_ica(raw, n_components=4, exclude=[0,1], random_state=97):
    ica = ICA(n_components=n_components, random_state=random_state)
    ica.fit(raw)
    ica.exclude = exclude
    raw_clean = ica.apply(raw)
    return raw_clean


def apply_pca(raw, n_components=0.95, return_model=False):
    clean_data = raw.get_data().T
    pca = PCA(n_components=n_components, random_state=42)
    X_compressed = pca.fit_transform(clean_data)
    if return_model:
        return X_compressed, pca
    return X_compressed


def preprocess_eeg(df, sfreq=256, n_components_pca=0.95, aggregate=True):
    features = ["alpha", "beta", "theta", "gamma"]

    # 1. Create MNE Raw object - in memory EEG object with 4 channels
    X_raw = df[features].values
    info = mne.create_info(ch_names=features, sfreq=sfreq, ch_types="eeg")
    raw = mne.io.RawArray(X_raw.T, info)

    # 2. Bandpass filter (1-40 Hz) - filters everything below 1 hz and above 40 hz
    for i in range(len(features)):
        raw._data[i,:] = bandpass_filter(raw._data[i,:], 1, 40, sfreq)

    # 3. Notch filter - remove 60hz electrical interference
    raw = apply_notch_filter(raw)

    # 4. ICA - exclude independent components
    raw = apply_ica(raw)

    # 5. PCA compression - further reduces noise
    X_compressed, pca_model = apply_pca(raw, n_components=0.95, return_model=True)

    # 6. Encode labels - converts text labels to numbers lables
    y = df['label'].values
    encoder = LabelEncoder()
    y_encoded = encoder.fit_transform(y)

    # 7.aggregation
    group_cols = []
    if "attempt_id" in df.columns:
        group_cols.append("attempt_id")
    if "label" in df.columns:
        group_cols.append("label")

    if group_cols:
        df_agg = df.groupby(group_cols)[features].mean().reset_index()

    return X_compressed, y_encoded, df_agg, encoder, pca_model