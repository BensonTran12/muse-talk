import os
import joblib
import numpy as np

# Correct path for use inside Docker (/app is the working directory)
MODEL_PATH = "/app/backend/data/cache/bigboy.joblib"


def load_model():
    if not os.path.exists(MODEL_PATH):
        print(f"[ModelLoader] ❌ No cached model found at {MODEL_PATH}")
        return None

    try:
        model_obj = joblib.load(MODEL_PATH)

        # Handle dict-style bundles
        if isinstance(model_obj, dict):
            keys = model_obj.keys()
            print(f"[ModelLoader] ℹ️ Loaded bundle keys: {list(keys)}")
            model_obj = model_obj.get("model", None)

        print(f"[ModelLoader] ✅ Loaded model successfully from {MODEL_PATH}")
        return model_obj

    except Exception as e:
        print(f"[ModelLoader] 💀 Failed to load model: {e}")
        return None


def classify_frame(model, data):
    """Classify a single EEG frame after preprocessing."""
    try:
        if model is None:
            raise ValueError("Model is None — not loaded.")

        # Convert data to numpy array
        if hasattr(data, "values"):  # DataFrame
            features = data.values
        else:
            features = np.array([data]) if isinstance(data, dict) else np.asarray(data)

        # Sanity check
        if features.size == 0:
            raise ValueError("Empty feature array passed to classifier.")

        # Run prediction
        prediction = model.predict(features)[0]

        # Compute confidence (if model supports predict_proba)
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(features)
            confidence = float(np.max(proba))
        else:
            confidence = 1.0  # fallback for non-probabilistic models

        print(f"[ModelLoader] 🧠 Classification result: {prediction} (confidence={confidence:.2f})")
        return {"label": str(prediction), "confidence": confidence}

    except Exception as e:
        print(f"[ModelLoader] 💀 Classification error: {e}")
        return {"label": "Unknown error", "confidence": 0.0}
