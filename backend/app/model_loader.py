import joblib
import os


MODEL_CACHE_PATH = os.path.join(os.path.dirname(__file__), '../data/cache/model.pkl')


# Load the latest cached model
def load_model():
    if not os.path.exists(MODEL_CACHE_PATH):
        print('[ModelLoader] No cached model found')
        return None
    try:
        model = joblib.load(MODEL_CACHE_PATH)
        print('[ModelLoader] Loaded model from cache')
        return model
    except Exception as e:
        print('[ModelLoader] Failed to load model:', e)
        return None

# Classify a preprocessed frame
def classify_frame(model, data):
    try:
        prediction = model.predict([data])
        result = prediction[0]
        print(f'[ModelLoader] Classification result: {result}')
        return result
    except Exception as e:
        print('[ModelLoader] Classification error:', e)
        return 'Unknown'