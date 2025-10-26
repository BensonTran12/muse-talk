import os
import requests
import asyncio
from datetime import datetime, timedelta
from .cache_manager import update_cache
import base64


# from .env.backend
LAMBDA_ENDPOINT = os.getenv('LAMBDA_ENDPOINT', 'https://dai6vxt176.execute-api.us-east-1.amazonaws.com/soChopped67')
CHECK_INTERVAL = 3600


async def schedule_model_updates():
    while True:
        try:
            print('[SageMakerSync] Checking for new model at', datetime.utcnow())
            response = requests.get(LAMBDA_ENDPOINT)
            if response.status_code == 200:
                data = response.json()
                if 'body' in data :
                    model_data = base64.b64decode(data['body'])
                    temp_path = '/tmp/latest_model.joblib'
                    with open(temp_path, 'wb') as f:
                        f.write(model_data)
                    print('[SageMakerSync] Model downloaded and cached.')
                    update_cache(temp_path)
                else:
                    print('[SageMakerSync] No model data found in response.')
            else:
                print('[SageMakerSync] Lambda response:', response.status_code)
        except Exception as e:
            print('[SageMakerSync] Error during update check:', e)
        await asyncio.sleep(CHECK_INTERVAL)