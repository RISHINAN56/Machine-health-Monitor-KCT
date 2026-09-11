import random
import numpy as np
import pandas as pd
from pathlib import Path


def generate_industrial_dataset(num_samples: int = 1500) -> pd.DataFrame:
    """
    Generates a realistic augmented industrial operating dataset for a textile loom.
    Covers 3 operational regimes: Healthy (60%), Warning (25%), Critical (15%).
    Features: temperature (°C), vibration (mm/s), motor_load (A-load), rpm (RPM).
    """
    np.random.seed(42)
    random.seed(42)

    records = []

    # 1. Healthy Regime (~60%)
    num_healthy = int(num_samples * 0.60)
    for _ in range(num_healthy):
        temp = np.random.normal(31.0, 4.5)
        vib = np.random.exponential(120.0) + 15.0
        load = np.random.normal(320.0, 75.0)
        rpm = np.random.normal(648.0, 18.0)

        temp = float(np.clip(temp, 22.0, 43.5))
        vib = float(np.clip(vib, 10.0, 440.0))
        load = float(np.clip(load, 90.0, 620.0))
        rpm = float(np.clip(rpm, 580.0, 730.0))

        records.append({
            "temperature": round(temp, 1),
            "vibration": round(vib, 1),
            "motor_load": round(load, 1),
            "rpm": round(rpm, 1),
            "machine_status": "Healthy",
        })

    # 2. Warning Regime (~25%)
    num_warning = int(num_samples * 0.25)
    for _ in range(num_warning):
        mode = random.choice(["thermal_rise", "vibration_increase", "load_increase", "speed_instability"])
        temp = np.random.normal(35.0, 4.0)
        vib = np.random.normal(300.0, 50.0)
        load = np.random.normal(450.0, 80.0)
        rpm = np.random.normal(640.0, 25.0)

        if mode == "thermal_rise":
            temp = np.random.uniform(45.5, 54.0)
        elif mode == "vibration_increase":
            vib = np.random.uniform(460.0, 730.0)
        elif mode == "load_increase":
            load = np.random.uniform(660.0, 840.0)
        elif mode == "speed_instability":
            rpm = random.choice([np.random.uniform(480.0, 560.0), np.random.uniform(770.0, 840.0)])

        temp = float(np.clip(temp, 25.0, 54.5))
        vib = float(np.clip(vib, 50.0, 745.0))
        load = float(np.clip(load, 120.0, 845.0))
        rpm = float(np.clip(rpm, 460.0, 850.0))

        records.append({
            "temperature": round(temp, 1),
            "vibration": round(vib, 1),
            "motor_load": round(load, 1),
            "rpm": round(rpm, 1),
            "machine_status": "Warning",
        })

    # 3. Critical Regime (~15%)
    num_critical = num_samples - num_healthy - num_warning
    for _ in range(num_critical):
        mode = random.choice(["bearing_failure", "thermal_runaway", "loom_jam", "motor_overload"])
        temp = np.random.normal(38.0, 5.0)
        vib = np.random.normal(350.0, 60.0)
        load = np.random.normal(500.0, 100.0)
        rpm = np.random.normal(630.0, 40.0)

        if mode == "bearing_failure":
            vib = np.random.uniform(780.0, 1480.0)
            temp = np.random.uniform(48.0, 65.0)
        elif mode == "thermal_runaway":
            temp = np.random.uniform(55.5, 78.0)
            load = np.random.uniform(600.0, 920.0)
        elif mode == "loom_jam":
            load = np.random.uniform(860.0, 1250.0)
            rpm = np.random.uniform(250.0, 480.0)
            vib = np.random.uniform(700.0, 1100.0)
        elif mode == "motor_overload":
            load = np.random.uniform(880.0, 1300.0)
            temp = np.random.uniform(56.0, 72.0)

        records.append({
            "temperature": round(float(temp), 1),
            "vibration": round(float(vib), 1),
            "motor_load": round(float(load), 1),
            "rpm": round(float(rpm), 1),
            "machine_status": "Critical",
        })

    random.shuffle(records)
    df = pd.DataFrame(records)
    return df


if __name__ == "__main__":
    df = generate_industrial_dataset()
    save_path = Path("augmented_machine_health_data.csv")
    df.to_csv(save_path, index=False)
    print(f"Generated {len(df)} samples saved to {save_path}")
    print(df["machine_status"].value_counts())
