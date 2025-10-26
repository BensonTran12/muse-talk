import os
import requests
import asyncio
from datetime import datetime, timedelta
from .cache_manager import update_cache


# from .env.backend
LAMBDA_ENDPOINT = os.getenv('LAMBDA_ENDPOINT', 'https://example-lambda.amazonaws.com/prod/check_model')
CHECK_INTERVAL = 3600 # every hour


async def schedule_model_updates():
    while True:
        try:
            print('[SageMakerSync] Checking for new model at', datetime.utcnow())
            response = requests.get(LAMBDA_ENDPOINT)
            if response.status_code == 200:
                data = response.json()
                if data.get('new_model_url'):
                    model_url = data['new_model_url']
                    print('[SageMakerSync] Found new model:', model_url)

                    r = requests.get(model_url)
                    if r.status_code == 200:
                        temp_path = '/tmp/latest_model.pkl'
                        with open(temp_path, 'wb') as f:
                            f.write(r.content)
                        update_cache(temp_path)
            else:
                print('[SageMakerSync] Lambda response:', response.status_code)
        except Exception as e:
            print('[SageMakerSync] Error during update check:', e)
        await asyncio.sleep(CHECK_INTERVAL)