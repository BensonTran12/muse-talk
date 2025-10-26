from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from .preprocess import preprocess
from .model_loader import load_model, classify_frame
from .sagemaker_sync import schedule_model_updates
import pandas as pd
import asyncio
import traceback

app = FastAPI(title="Muse Backend", version="1.1.0")

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict to localhost if you prefer
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Global model reference ---
model = None


@app.on_event("startup")
async def startup_event():
    """Load model and start periodic SageMaker sync on backend startup."""
    global model
    try:
        model = load_model()

        # 🩹 FIX: handle dict-style bundles here
        if isinstance(model, dict):
            if "model" in model:
                print("⚙️ Extracted model object from bundle on startup.")
                model = model["model"]
            else:
                print("❌ Model bundle missing 'model' key — cannot proceed.")
                model = None

        if model:
            print("✅ Model loaded successfully.")
        else:
            print("⚠️ No model available on startup.")
    except Exception as e:
        print(f"⚠️ Failed to load model on startup: {e}")
        traceback.print_exc()

    # Start periodic SageMaker sync loop
    try:
        asyncio.create_task(schedule_model_updates())
        print("🌀 SageMaker sync task started.")
    except Exception as e:
        print(f"⚠️ Failed to start SageMaker sync worker: {e}")
        traceback.print_exc()


@app.get("/")
async def root():
    return {"message": "Muse backend is alive and frowning slightly."}


@app.get("/status")
async def status():
    """Return backend readiness for the Muse bridge to check."""
    global model
    if model is not None:
        return {"status": "ready"}
    return JSONResponse({"status": "loading"}, status_code=503)


@app.post("/frame")
async def receive_frame(request: Request):
    """
    Receives a JSON payload containing a single EEG frame
    Example: {"alpha": 0.1, "beta": 0.2, "theta": 0.05, "gamma": 0.01}
    """
    try:
        data = await request.json()
        if not isinstance(data, dict):
            return JSONResponse({"error": "Invalid format: expected JSON object"}, status_code=400)

        # --- Step 1: Convert to DataFrame and preprocess ---
        df = pd.DataFrame([data])
        cleaned = preprocess(df, aggregate=True, add_features=True)

        # --- Step 2: Ensure model is loaded ---
        global model
        if model is None:
            model = load_model()

            # 🩹 FIX: handle dict-style bundles here too
            if isinstance(model, dict):
                if "model" in model:
                    print("⚙️ Extracted model object from bundle during request.")
                    model = model["model"]
                else:
                    print("❌ Model bundle missing 'model' key — cannot proceed.")
                    model = None

            if model is None:
                return JSONResponse({"error": "Model not available"}, status_code=503)

        # --- Step 3: Classify frame ---
        result = classify_frame(model, cleaned)

        return JSONResponse({
            "result": result.get("label", "unknown"),
            "confidence": result.get("confidence", None)
        })

    except Exception as e:
        traceback.print_exc()
        return JSONResponse({"error": str(e)}, status_code=500)
