import os
import joblib
import numpy as np
import pandas as pd

MODEL_PATHS = [
    "backend/data/cache/model_bundle.joblib",
    "../backend/data/cache/model_bundle.joblib",
    "model_bundle.joblib"
]

print("🔍 Searching for model_bundle.joblib...")
model_path = next((p for p in MODEL_PATHS if os.path.exists(p)), None)
if not model_path:
    raise FileNotFoundError("❌ Could not find model_bundle.joblib in any expected location.")

print(f"✅ Found model: {model_path}\n")

# --- LOAD MODEL BUNDLE ---
bundle = joblib.load(model_path)
model = bundle.get("model", None)
features = bundle.get("features", [])

print(f"🧩 Model type: {type(model)}")
print(f"📊 Number of features: {len(features)}")
print(f"🧠 Feature sample: {features[:10]}\n")

# --- MODEL ATTRIBUTES ---
if hasattr(model, "classes_"):
    print("🎯 Classes:", model.classes_)
else:
    print("⚠️ No 'classes_' attribute found. Model might not be classifier.")

if hasattr(model, "coef_"):
    coef = model.coef_
    print(f"\n📉 Coefficients shape: {coef.shape}")
    print("Sample coefficients (first 10):")
    print(coef[0][:10])
    if np.allclose(coef, 0):
        print("⚠️ All coefficients are zero — model learned nothing.")
else:
    print("⚠️ No coefficients attribute. Model may not be linear or not fitted.")

if hasattr(model, "feature_importances_"):
    print("\n🌲 Feature importances (first 10):")
    print(model.feature_importances_[:10])

# --- RANDOM TESTS ---
print("\n🧪 Testing raw predictions...")
try:
    test_inputs = np.array([
        [1, 1, 1, 1],
        [100, 200, 300, 400],
        [0.1, 0.5, 0.9, 1.2],
        [10, 10, 10, 10]
    ])

    # Match feature count if needed
    if len(features) > 4:
        padded = np.zeros((4, len(features)))
        padded[:, :4] = test_inputs
        test_inputs = padded

    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(test_inputs)
        for i, p in enumerate(probs):
            print(f"\nInput {i}: {test_inputs[i][:4]} → Probabilities:")
            for lbl, val in zip(model.classes_, p):
                bar = "█" * int(val * 40)
                print(f"   {lbl:<10}: {val:.4f} {bar}")
    else:
        preds = model.predict(test_inputs)
        print("Model does not support predict_proba(), raw preds:")
        print(preds)
except Exception as e:
    print(f"❌ Error running test inputs: {e}")

print("\n✅ Diagnostic complete.")
