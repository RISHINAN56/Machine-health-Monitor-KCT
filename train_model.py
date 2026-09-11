from ml_pipeline import (
    load_dataset,
    predict_machine_status,
    prepare_features_labels,
    save_model,
    train_decision_tree,
)


def main():
    # Step 1: Load and inspect dataset.
    dataset = load_dataset("machine_health_data.csv")
    print("Dataset preview:")
    print(dataset.head())

    # Step 2: Prepare feature matrix and labels.
    X, y = prepare_features_labels(dataset)

    # Step 3: Train Decision Tree classifier.
    model = train_decision_tree(X, y)

    # Step 4: Test model with the requested sample.
    sample_prediction = predict_machine_status(
        temperature=25.7,
        vibration=1008,
        load=95,
        rpm=890,
        model=model,
    )
    print("\nSample prediction for [25.7, 1008, 95, 890]:", sample_prediction)

    # Step 5: Save trained model.
    save_model(model, "rapier_model.pkl")
    print("Model saved as rapier_model.pkl")


if __name__ == "__main__":
    main()
