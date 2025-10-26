import asyncio
from app.sagemaker_sync import schedule_model_updates

if __name__ == "__main__":
    print("[SageMakerSyncWorker] Starting model update scheduler...")
    asyncio.run(schedule_model_updates())
