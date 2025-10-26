from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from .preprocess import preprocess_csv
from .model_loader import load_model, classify_frame
from .sagemaker_sync import schedule_model_updates
import asyncio

app = FastAPI(title="Muse Backend")

@app.on_event("startup")
async def startup_event():
    # Schedule periodic model updates
    asyncio.create_task(schedule_model_updates())

@app.get("/")
async def root():
    return {"message": "Muse backend is running"}

@app.post("/frame")
async def receive_frame(request: Request):
    data = await request.json()

    # Step 1: preprocess
    cleaned = preprocess_csv(data)

    # Step 2: load cached model
    model = load_model()
    if not model:
        return JSONResponse({"error": "No model available"}, status_code=503)

    # Step 3: classify
    result = classify_frame(model, cleaned)

    return JSONResponse({"result": result})
