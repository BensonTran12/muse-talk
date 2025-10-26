import os
import sys
import joblib
import argparse
import pandas as pd
import numpy as np
import importlib.util
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

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

# --- CONFIG ---
DEFAULT_FRAME_SIZE = 1000
MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "data", "cache", "bigboy.joblib"))


# --- CLI OPTIONS ---
parser = argparse.ArgumentParser(description="Simulate and inspect EEG model predictions.")
parser.add_argument("--file", type=str, required=True, help="Path to EEG CSV file.")
parser.add_argument("--frame", type=int, default=DEFAULT_FRAME_SIZE, help="Frame size per window.")
parser.add_argument("--model", type=str, default=MODEL_PATH, help="Path to bigboy.joblib.")
args = parser.parse_args()

# --- LOAD MODEL ---
if not os.path.exists(args.model):
    raise FileNotFoundError(f"❌ Could not find model file: {args.model}")

bundle = joblib.load(args.model)
model = bundle["model"]
feature_cols = bundle["features"]

print(f"✅ Model loaded from {args.model}")
print(f"📊 Expected features: {len(feature_cols)} → {feature_cols[:10]}...")

# --- LOAD DATA ---
df = pd.read_csv(args.file)
base_cols = ["alpha", "beta", "theta", "gamma"]
for c in base_cols:
    if c not in df.columns:
        raise ValueError(f"Missing required column: {c}")

print(f"✅ Loaded {len(df)} samples from {args.file}")

# --- SIMULATED STREAMING LOOP ---
for i in range(0, len(df), args.frame):
    frame = df.iloc[i:i + args.frame]
    if len(frame) < args.frame:
        break

    # Apply the *exact same* preprocessing pipeline as training
    processed = preprocess(frame, aggregate=True, add_features=True)
    processed = processed.reindex(columns=feature_cols, fill_value=0)

    try:
        probs = model.predict_proba(processed)[0]
        labels = model.classes_
        pred_idx = int(np.argmax(probs))
        pred_label = labels[pred_idx]
        conf = probs[pred_idx]

        print(f"\n🧩 Frame {i // args.frame}")
        print("---------------------------")
        for c in base_cols:
            val = float(frame[c].mean())
            print(f"{c:>6}: {val:.6f}")

        print("\nRaw model probabilities:")
        for lbl, p in zip(labels, probs):
            bar = "█" * int(p * 40)
            print(f"   {lbl:<10}: {p:.4f} {bar}")

        print(f"\n🏷️ Predicted: {pred_label}  (Confidence: {conf:.3f})")

    except Exception as e:
        print(f"❌ Prediction error at frame {i // args.frame}: {e}")
        sys.exit(1)
