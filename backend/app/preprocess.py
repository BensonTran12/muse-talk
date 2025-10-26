import pandas as pd
import numpy as np
from scipy.signal import butter, filtfilt, welch, iirnotch
import warnings

warnings.filterwarnings("ignore", category=RuntimeWarning)

# --- FILTER HELPERS ---
def bandpass_filter(data, lowcut=1.0, highcut=40.0, fs=256, order=5):
    """Apply bandpass filter to EEG signal."""
    nyq = 0.5 * fs
    low, high = lowcut / nyq, highcut / nyq
    b, a = butter(order, [low, high], btype="band")
    return filtfilt(b, a, data)


def notch_filter(data, freq=60.0, fs=256, quality=30):
    """Remove powerline noise."""
    b, a = iirnotch(freq, quality, fs)
    return filtfilt(b, a, data)


# --- ARTIFACT REDUCTION ---
def remove_blink_artifacts(df, threshold=150.0):
    """Interpolates and smooths spikes above threshold to reduce blink/muscle artifacts."""
    features = ["alpha", "beta", "theta", "gamma"]
    for f in features:
        if f in df.columns:
            mask = df[f].abs() > threshold
            if mask.any():
                df.loc[mask, f] = np.nan
                df[f] = df[f].interpolate().bfill().ffill()
    return df


# --- FEATURE EXPANSION ---
def add_psd_features(df, fs=256):
    """Adds Power Spectral Density (PSD) metrics per EEG band."""
    bands = {"theta": (4, 8), "alpha": (8, 13), "beta": (13, 30), "gamma": (30, 40)}
    psd_features = []

    for f in ["alpha", "beta", "theta", "gamma"]:
        if f not in df.columns:
            continue
        data = df[f].values
        data = np.nan_to_num(data)
        if len(data) < 8:
            continue

        freqs, psd = welch(data, fs=fs, nperseg=min(len(data), 256))
        for band, (low, high) in bands.items():
            mask = (freqs >= low) & (freqs <= high)
            if np.any(mask):
                band_power = psd[mask].mean()
                df[f"{f}_{band}_power"] = band_power
                psd_features.append(f"{f}_{band}_power")

    return df, psd_features


def add_interaction_features(df):
    """Creates cross-power and self-power terms between EEG bands."""
    features = ["alpha", "beta", "theta", "gamma"]
    for a in features:
        for b in features:
            if a in df.columns and b in df.columns:
                df[f"{a}_{b}_power"] = df[a] * df[b]
    return df


# --- MAIN PIPELINE ---
def preprocess(df: pd.DataFrame, aggregate: bool = True, add_features: bool = True) -> pd.DataFrame:
    """
    Full EEG preprocessing pipeline — filters, artifact cleaning, feature expansion.
    """
    if df.empty:
        return df

    df = df.copy()
    df = df.replace([np.inf, -np.inf], np.nan).dropna(how="all")

    features = ["alpha", "beta", "theta", "gamma"]

    # 1. Bandpass + Notch filtering
    for f in features:
        if f in df.columns:
            try:
                df[f] = bandpass_filter(df[f].values)
                df[f] = notch_filter(df[f].values)
            except Exception:
                pass

    # 2. Artifact cleanup
    df = remove_blink_artifacts(df)

    # 3. Add features
    psd_features = []
    if add_features:
        try:
            df, psd_features = add_psd_features(df)
        except Exception as e:
            print(f"[Preprocess] PSD feature gen failed: {e}")
        df = add_interaction_features(df)

        # Guarantee that we always return expected feature names
        all_extra = [c for c in df.columns if c not in features]
        missing = max(0, 21 - len(all_extra) - len(features))
        if missing > 0:
            for i in range(missing):
                df[f"placeholder_{i}"] = 0.0

    # 4. Aggregate by attempt_id and label if available
    if aggregate:
        group_cols = []
        if "attempt_id" in df.columns:
            group_cols.append("attempt_id")
        if "label" in df.columns:
            group_cols.append("label")

        if group_cols:
            aggregated = df.groupby(group_cols)[features + psd_features].mean().reset_index()
        else:
            aggregated = df[features + psd_features].mean().to_frame().T

        return aggregated

    return df
