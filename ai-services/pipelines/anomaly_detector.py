"""
SmartLedger AI ERP — Isolation Forest Credit Risk & Anomaly Detector
Evaluates customer payment delays, transaction frequencies, and default ratios.
"""
import os
import joblib
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from typing import Dict, Any, List

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "isolation_forest_risk.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "risk_scaler.pkl")

class CreditRiskAnomalyDetector:
    def __init__(self):
        self.model = None
        self.scaler = None
        self._load_or_train()

    def _load_or_train(self):
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
            try:
                self.model = joblib.load(MODEL_PATH)
                self.scaler = joblib.load(SCALER_PATH)
                print("[OK] Loaded pre-trained Isolation Forest model & scaler.")
                return
            except Exception as e:
                print(f"[!] Warning loading risk model ({e}). Re-training.")

        # Synthetic baseline training set
        # Features: [transaction_frequency (per mo), average_ticket_size, overdue_days, unpaid_balance_ratio]
        np.random.seed(42)
        n_samples = 600

        # Regular, safe buyers
        freq_safe = np.random.uniform(5, 30, int(n_samples * 0.95))
        ticket_safe = np.random.uniform(2000, 45000, int(n_samples * 0.95))
        overdue_safe = np.random.exponential(2.5, int(n_samples * 0.95)).clip(0, 15)
        unpaid_safe = np.random.uniform(0.0, 0.25, int(n_samples * 0.95))
        safe_data = np.column_stack([freq_safe, ticket_safe, overdue_safe, unpaid_safe])

        # Defaulting / erratic buyers (anomalies)
        freq_anom = np.random.uniform(0.5, 4, int(n_samples * 0.05))
        ticket_anom = np.random.uniform(60000, 150000, int(n_samples * 0.05))
        overdue_anom = np.random.uniform(35, 90, int(n_samples * 0.05))
        unpaid_anom = np.random.uniform(0.65, 1.2, int(n_samples * 0.05))
        anom_data = np.column_stack([freq_anom, ticket_anom, overdue_anom, unpaid_anom])

        X = np.vstack([safe_data, anom_data])

        self.scaler = StandardScaler()
        X_scaled = self.scaler.fit_transform(X)

        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.05,
            random_state=42
        )
        self.model.fit(X_scaled)

        joblib.dump(self.model, MODEL_PATH)
        joblib.dump(self.scaler, SCALER_PATH)
        print("[OK] Trained & saved Isolation Forest Risk Detector.")

    def score(self, transaction_frequency: float, average_ticket_size: float, overdue_days: float, unpaid_balance_ratio: float) -> Dict[str, Any]:
        """
        Input vector: [transaction_frequency, average_ticket_size, overdue_days, unpaid_balance_ratio]
        """
        sample = np.array([[
            float(transaction_frequency),
            float(average_ticket_size),
            float(overdue_days),
            float(unpaid_balance_ratio)
        ]])

        scaled_sample = self.scaler.transform(sample)
        
        # predict: 1 = inlier (normal), -1 = outlier (anomaly)
        pred = self.model.predict(scaled_sample)[0]
        # decision_function: lower means more abnormal
        raw_score = float(self.model.decision_function(scaled_sample)[0])

        is_anomaly = bool(pred == -1 or overdue_days > 25.0 or unpaid_balance_ratio > 0.60)
        
        # Calculate normalized risk score between 0.0 and 100.0
        # raw_score is roughly between -0.3 and 0.3
        risk_metric = max(0.0, min(100.0, (0.25 - raw_score) * 150.0 + (overdue_days * 1.2) + (unpaid_balance_ratio * 30.0)))
        risk_score_rounded = round(float(risk_metric), 1)

        flag_level = "HIGH_RISK" if (is_anomaly or risk_score_rounded > 60.0) else ("MEDIUM" if risk_score_rounded > 35.0 else "NORMAL")

        actions = {
            "HIGH_RISK": "Freeze trade credit line. Demand advance payment / bank guarantee.",
            "MEDIUM": "Restrict terms to Net 15. Require manager pre-approval.",
            "NORMAL": "Eligible for standard Net 30/60 trade credit."
        }

        # Synthesize plain-English explainability factors
        factors = []
        if overdue_days > 30:
            factors.append(f"Severe payment delay: Overdue by {overdue_days} days (threshold: 15 days).")
        elif overdue_days > 15:
            factors.append(f"Moderate payment delay: Overdue by {overdue_days} days.")
        
        if unpaid_balance_ratio > 0.8:
            factors.append(f"Critical credit utilization: Currently using {int(unpaid_balance_ratio * 100)}% of approved limit.")
        elif unpaid_balance_ratio > 0.5:
            factors.append(f"Elevated credit utilization: Currently using {int(unpaid_balance_ratio * 100)}% of limit.")

        if transaction_frequency < 2.0:
            factors.append("Irregular or low transaction velocity compared to cohort baseline.")

        if not factors:
            factors.append("Payment patterns and balance ratios align with prime credit benchmarks.")

        explainability_text = " | ".join(factors)

        return {
            "status": "success",
            "is_anomaly": is_anomaly,
            "decision_function_score": round(raw_score, 4),
            "risk_score": risk_score_rounded,
            "flag_level": flag_level,
            "recommended_action": actions[flag_level],
            "risk_factors": factors,
            "explainability": explainability_text,
            "metrics": {
                "transaction_frequency": transaction_frequency,
                "average_ticket_size": average_ticket_size,
                "overdue_days": overdue_days,
                "unpaid_balance_ratio": unpaid_balance_ratio
            }
        }

# Global instance
risk_detector = CreditRiskAnomalyDetector()
