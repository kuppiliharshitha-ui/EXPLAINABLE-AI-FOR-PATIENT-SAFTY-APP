"""
XAI Patient Safety System - Backend API
Stack: Flask, scikit-learn, SHAP, pandas
"""

from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_cors import CORS
import numpy as np
import pandas as pd
import shap
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score
import warnings
import os

warnings.filterwarnings("ignore")

app = Flask(__name__)
CORS(app)

# ─────────────────────────────────────────────
# SYNTHETIC TRAINING DATA
# ─────────────────────────────────────────────
def generate_training_data(n=2000):
    np.random.seed(42)
    data = {
        "age": np.random.randint(18, 90, n),
        "heart_rate": np.random.normal(75, 18, n).clip(40, 180),
        "systolic_bp": np.random.normal(120, 20, n).clip(70, 220),
        "diastolic_bp": np.random.normal(80, 12, n).clip(40, 130),
        "temperature": np.random.normal(37.0, 0.8, n).clip(35, 42),
        "spo2": np.random.normal(97, 2.5, n).clip(80, 100),
        "respiratory_rate": np.random.normal(16, 4, n).clip(8, 40),
        "glucose": np.random.normal(95, 25, n).clip(50, 400),
        "wbc": np.random.normal(7.5, 3, n).clip(1, 30),
        "creatinine": np.random.normal(1.0, 0.4, n).clip(0.3, 10),
        "lactate": np.random.normal(1.5, 0.8, n).clip(0.5, 12),
        "num_medications": np.random.randint(0, 20, n),
        "icu_days": np.random.randint(0, 30, n),
        "prev_admissions": np.random.randint(0, 10, n),
        "comorbidities": np.random.randint(0, 8, n),
    }
    df = pd.DataFrame(data)

    risk_score = (
        (df["heart_rate"] > 100).astype(int) * 2 +
        (df["systolic_bp"] < 90).astype(int) * 3 +
        (df["spo2"] < 94).astype(int) * 3 +
        (df["temperature"] > 38.5).astype(int) * 2 +
        (df["lactate"] > 2.5).astype(int) * 3 +
        (df["wbc"] > 12).astype(int) * 2 +
        (df["creatinine"] > 1.5).astype(int) * 1 +
        (df["comorbidities"] > 4).astype(int) * 1 +
        np.random.randint(0, 2, n)
    )
    df["high_risk"] = (risk_score >= 5).astype(int)
    return df

# ─────────────────────────────────────────────
# MODEL TRAINING
# ─────────────────────────────────────────────
FEATURE_COLS = [
    "age", "heart_rate", "systolic_bp", "diastolic_bp",
    "temperature", "spo2", "respiratory_rate", "glucose",
    "wbc", "creatinine", "lactate", "num_medications",
    "icu_days", "prev_admissions", "comorbidities"
]

print("⚙ Training model...")
df_train = generate_training_data(2000)
X = df_train[FEATURE_COLS]
y = df_train["high_risk"]

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

X_tr, X_te, y_tr, y_te = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

model = GradientBoostingClassifier(n_estimators=200, max_depth=4)
model.fit(X_tr, y_tr)

y_prob = model.predict_proba(X_te)[:, 1]
auc = roc_auc_score(y_te, y_prob)
print(f"✅ Model AUC: {auc:.3f}")

explainer = shap.TreeExplainer(model)
print("✅ SHAP ready")

# ─────────────────────────────────────────────
# HELPER FUNCTION
# ─────────────────────────────────────────────
def build_explanation(patient_dict):
    df_patient = pd.DataFrame([patient_dict])[FEATURE_COLS]
    X_scaled = scaler.transform(df_patient)

    risk_prob = float(model.predict_proba(X_scaled)[0][1])
    risk_label = "HIGH" if risk_prob >= 0.6 else "LOW"

    shap_vals = explainer.shap_values(X_scaled)[0]

    contributions = []
    for f, s in zip(FEATURE_COLS, shap_vals):
        contributions.append({
            "feature": f,
            "value": float(patient_dict[f]),
            "impact": float(s)
        })

    return {
        "risk_probability": round(risk_prob, 3),
        "risk_label": risk_label,
        "auc": round(auc, 3),
        "contributions": contributions
    }

# ─────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/dashboard.html")
def dashboard_html():
    return redirect(url_for("dashboard"))

@app.route("/api/analyze", methods=["POST"])
def analyze():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data"}), 400

    try:
        patient = {k: float(data[k]) for k in FEATURE_COLS}
        result = build_explanation(patient)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/demo")
def demo():
    demo_patient = {f: 50 for f in FEATURE_COLS}
    result = build_explanation(demo_patient)
    return jsonify(result)

@app.route("/api/health")
def health():
    return jsonify({"status": "OK"})

# ─────────────────────────────────────────────
# RUN APP (FIXED FOR RENDER)
# ─────────────────────────────────────────────
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
