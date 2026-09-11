import pickle
from pathlib import Path

import pandas as pd
from sklearn.tree import DecisionTreeClassifier

DATASET_PATH = Path("machine_health_data.csv")
MODEL_PATH = Path("rapier_model.pkl")
FEATURE_COLUMNS = ["temperature", "vibration", "motor_load", "rpm"]
TARGET_COLUMN = "machine_status"


def load_dataset(csv_path: Path | str = DATASET_PATH) -> pd.DataFrame:
    """Load the generic machine health dataset from CSV."""
    return pd.read_csv(csv_path)


def prepare_features_labels(df: pd.DataFrame):
    """Split dataframe into feature matrix X and label vector y."""
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]
    return X, y


def train_decision_tree(X: pd.DataFrame, y: pd.Series) -> DecisionTreeClassifier:
    """Train and return a Decision Tree classification model."""
    model = DecisionTreeClassifier(random_state=42, max_depth=5)
    model.fit(X, y)
    return model


def save_model(model: DecisionTreeClassifier, model_path: Path | str = MODEL_PATH) -> None:
    """Persist a trained model as a pickle file."""
    with open(model_path, "wb") as file:
        pickle.dump(model, file)


def load_model(model_path: Path | str = MODEL_PATH) -> DecisionTreeClassifier:
    """Load a trained model from pickle file."""
    with open(model_path, "rb") as file:
        return pickle.load(file)


def ensure_model(model_path: Path | str = MODEL_PATH, dataset_path: Path | str = DATASET_PATH):
    """Load existing model, or train and save a new one if missing."""
    model_path = Path(model_path)
    if model_path.exists():
        model = load_model(model_path)
        model_features = list(getattr(model, "feature_names_in_", []))
        if model_features == FEATURE_COLUMNS:
            return model

    dataset = load_dataset(dataset_path)
    X, y = prepare_features_labels(dataset)
    model = train_decision_tree(X, y)
    save_model(model, model_path)
    return model


def predict_machine_status(
    temperature: float,
    vibration: float,
    load: float,
    rpm: float,
    model: DecisionTreeClassifier,
) -> str:
    """Predict machine status label for incoming sensor readings."""
    row = pd.DataFrame(
        [
            {
                "temperature": temperature,
                "vibration": vibration,
                "motor_load": load,
                "rpm": rpm,
            }
        ]
    )
    return str(model.predict(row)[0])
