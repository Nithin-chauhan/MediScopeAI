import os
import joblib
from functools import lru_cache

MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')
SCALERS_DIR = os.path.join(os.path.dirname(__file__), 'scalers')

@lru_cache(maxsize=4)
def load_model(disease_name: str):
    """Loads the model for the given disease. Caches the result in memory."""
    model_path = os.path.join(MODELS_DIR, f"{disease_name}_model.pkl")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found for {disease_name}. Run training script.")
    return joblib.load(model_path)

@lru_cache(maxsize=4)
def load_scaler(disease_name: str):
    """Loads the scaler for the given disease. Caches the result in memory."""
    scaler_path = os.path.join(SCALERS_DIR, f"{disease_name}_scaler.pkl")
    if not os.path.exists(scaler_path):
        raise FileNotFoundError(f"Scaler file not found for {disease_name}. Run training script.")
    return joblib.load(scaler_path)

@lru_cache(maxsize=4)
def load_metrics(disease_name: str):
    """Loads the metrics for the given disease for the dashboard."""
    metrics_path = os.path.join(MODELS_DIR, f"{disease_name}_metrics.pkl")
    if not os.path.exists(metrics_path):
        return {}
    return joblib.load(metrics_path)
