import logging
import os
from pathlib import Path
from typing import Dict, Tuple
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

from app.models.telemetry import MachineStatus, RawSensorData
from app.ml.dataset_generator import generate_industrial_dataset

logger = logging.getLogger("digital_twin.ml")

MODEL_DIR = Path(__file__).resolve().parent / "saved_models"
MODEL_PATH = MODEL_DIR / "loom_health_rf_model.joblib"
FEATURE_NAMES = ["temperature", "vibration", "motor_load", "rpm"]


class MachineHealthClassifier:
    def __init__(self):
        self.model: RandomForestClassifier | None = None
        self.classes: list[str] = ["Healthy", "Warning", "Critical"]
        self.ensure_trained_model()

    def ensure_trained_model(self) -> None:
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        if MODEL_PATH.exists():
            try:
                self.model = joblib.load(MODEL_PATH)
                logger.info("Loaded trained ML model from %s", MODEL_PATH)
                return
            except Exception as err:
                logger.warning("Failed loading model from %s (%s). Retraining...", MODEL_PATH, err)

        self.train_and_save()

    def train_and_save(self) -> None:
        logger.info("Generating augmented industrial training dataset...")
        df = generate_industrial_dataset(num_samples=2000)

        X = df[FEATURE_NAMES]
        y = df["machine_status"]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=8,
            min_samples_split=4,
            random_state=42,
            n_jobs=-1,
        )
        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        logger.info("Model training complete. Evaluation:\n%s", classification_report(y_test, y_pred))

        joblib.dump(model, MODEL_PATH)
        self.model = model
        logger.info("Model persisted successfully to %s", MODEL_PATH)

    def predict(self, sensors: RawSensorData) -> Tuple[MachineStatus, float, Dict[str, float], float, float, float]:
        """
        Runs inference and returns:
        - status: MachineStatus
        - confidence: float (0.0 - 1.0)
        - probabilities: Dict[str, float]
        - failure_probability: float (0 - 100%)
        - risk_percentage: float (0 - 100%)
        - remaining_useful_life_hours: float
        """
        if self.model is None:
            self.ensure_trained_model()

        input_df = pd.DataFrame([{
            "temperature": sensors.temperature,
            "vibration": sensors.vibration,
            "motor_load": sensors.motor_load,
            "rpm": sensors.rpm,
        }])

        probs = self.model.predict_proba(input_df)[0]
        class_labels = list(self.model.classes_)
        prob_dict = {label: round(float(prob), 4) for label, prob in zip(class_labels, probs)}

        # Make sure all standard keys exist
        for cl in ["Healthy", "Warning", "Critical"]:
            if cl not in prob_dict:
                prob_dict[cl] = 0.0

        predicted_idx = int(np.argmax(probs))
        predicted_class_str = class_labels[predicted_idx]
        confidence = round(float(probs[predicted_idx]), 4)

        if predicted_class_str == "Healthy":
            status = MachineStatus.HEALTHY
        elif predicted_class_str == "Warning":
            status = MachineStatus.WARNING
        else:
            status = MachineStatus.CRITICAL

        # Calculate Failure Probability & Risk Percentage
        # Critical prob is direct failure risk, warning prob contributes 40%
        failure_probability = round((prob_dict["Critical"] + prob_dict["Warning"] * 0.4) * 100.0, 2)
        failure_probability = min(100.0, max(0.0, failure_probability))

        risk_percentage = round((prob_dict["Critical"] * 1.0 + prob_dict["Warning"] * 0.55) * 100.0, 2)
        risk_percentage = min(100.0, max(0.0, risk_percentage))

        # Remaining Useful Life (RUL) estimation in hours
        # Baseline healthy loom: ~720 - 1200 operating hours to next major service
        if status == MachineStatus.HEALTHY:
            rul_hours = round(720.0 + (1.0 - prob_dict["Warning"]) * 280.0, 1)
        elif status == MachineStatus.WARNING:
            rul_hours = round(48.0 + (1.0 - prob_dict["Critical"]) * 120.0, 1)
        else:
            # Critical: failure imminent in 2 to 24 hours
            rul_hours = round(max(1.5, (1.0 - prob_dict["Critical"]) * 24.0), 1)

        return status, confidence, prob_dict, failure_probability, risk_percentage, rul_hours


ml_classifier = MachineHealthClassifier()
