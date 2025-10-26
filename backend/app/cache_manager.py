import shutil
import os


CACHE_DIR = os.path.join(os.path.dirname(__file__), '../data/cache')

def update_cache(new_model_path):
    target_path = os.path.join(CACHE_DIR, 'model.pkl')
    os.makedirs(CACHE_DIR, exist_ok=True)
    try:
        shutil.copy(new_model_path, target_path)
        print('[CacheManager] Cache updated successfully')
        return True
    except Exception as e:
        print('[CacheManager] Cache update failed:', e)
        return False