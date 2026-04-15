from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_cors import CORS
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
import warnings

warnings.filterwarnings("ignore")

app = Flask(__name__)
CORS(app)

# FEATURES
FEATURE_COLS = [
    "age", "heart_rate", "systolic_bp", "diastolic_bp",
    "temperature", "spo2", "respiratory_rate", "glucose",
    "wbc", "creatinine", "lactate", "num_medications",
    "icu_days", "prev_admissions", "comorbidities"
]

# LIGHT MODEL (optimized for Render)
def generate_training_data(n=200):
    np.random.seed(42)
    data = {f: np.random.rand(n)*100 for f in FEATURE_COLS}
    df = pd.DataFrame(data)
    df["high_risk"] = np.random.randint(0, 2, n)
    return df

df = generate_training_data(200)
X = df[FEATURE_COLS]
y = df["high_risk"]

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

model = GradientBoostingClassifier(n_estimators=50, max_depth=3)
model.fit(X_scaled, y)

# SIMPLE EXPLANATION (NO SHAP)
def build_explanation(patient_dict):
    df_patient = pd.DataFrame([patient_dict])[FEATURE_COLS]
    X_scaled = scaler.transform(df_patient)

    risk_prob = float(model.predict_proba(X_scaled)[0][1])
    risk_label = "HIGH" if risk_prob >= 0.6 else "LOW"

    return {
        "risk_probability": round(risk_prob, 3),
        "risk_label": risk_label,
        "contributions": []
    }

# ROUTES
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
        return jsonify(build_explanation(patient))
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/demo")
def demo():
    demo_patient = {f: 50 for f in FEATURE_COLS}
    return jsonify(build_explanation(demo_patient))

@app.route("/api/health")
def health():
    return jsonify({"status": "OK"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
