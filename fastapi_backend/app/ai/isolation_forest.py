import os
import joblib
import numpy as np
from sklearn.ensemble import IsolationForest
from app.core.config import settings

class FraudDetector:
    MODEL_PATH = settings.AI_MODEL_PATH
    CONTAMINATION = 0.05
    RISK_THRESHOLD = 0.65

    def __init__(self):
        self.model = self._load_or_train()

    def _load_or_train(self):
        if os.path.exists(self.MODEL_PATH):
            return joblib.load(self.MODEL_PATH)
        return self._train_on_seed_data()

    def _train_on_seed_data(self):
        # 500 normal samples
        np.random.seed(42)
        normal = np.random.normal(loc=[100, 0.05, 3, 2, 14, 0], scale=[20, 0.02, 1, 1, 4, 0.1], size=(500, 6))
        # 25 anomalous samples
        anomalies = np.random.normal(loc=[5000, 0.4, 15, 0.1, 3, 2.5], scale=[1000, 0.1, 5, 0.05, 2, 0.5], size=(25, 6))
        X_train = np.vstack([normal, anomalies])
        
        model = IsolationForest(n_estimators=200, contamination=self.CONTAMINATION, random_state=42)
        model.fit(X_train)
        os.makedirs(os.path.dirname(self.MODEL_PATH), exist_ok=True)
        joblib.dump(model, self.MODEL_PATH)
        return model

    def predict(self, feature_vector: np.ndarray) -> dict:
        raw_score = self.model.decision_function(feature_vector)[0]
        risk_score = max(0.0, min(1.0, (0.5 - raw_score)))
        return {
            "anomaly_detected": risk_score > self.RISK_THRESHOLD,
            "risk_score": round(risk_score, 4),
            "raw_decision_score": round(float(raw_score), 4),
            "flag_level": "HIGH_RISK" if risk_score > 0.80 else ("MEDIUM_RISK" if risk_score > 0.65 else "LOW_RISK")
        }

fraud_detector = FraudDetector()
