"""
Melatih model klasifikasi Potability dari dataset (Kaggle atau sample).
Jalankan: python ml/train_model.py
Output: ml/model.pkl (RandomForest terlatih)
"""
import sys, os
sys.path.append(os.path.dirname(__file__))

import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score

from preprocess import load_and_clean, FEATURES

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "water_potability.csv")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")


def main():
    df = load_and_clean(DATA_PATH)
    X = df[FEATURES]
    y = df["Potability"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=200, max_depth=8, random_state=42, class_weight="balanced"
    )
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    print(f"Akurasi test set: {accuracy_score(y_test, preds):.3f}")
    print(classification_report(y_test, preds, target_names=["Tidak layak", "Layak"]))

    joblib.dump({"model": model, "features": FEATURES}, MODEL_PATH)
    print(f"Model tersimpan -> {MODEL_PATH}")


if __name__ == "__main__":
    main()
