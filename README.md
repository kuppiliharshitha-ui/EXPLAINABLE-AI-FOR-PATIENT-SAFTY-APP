# XAI Patient Safety — Web Application

A full-stack Flask web app that uses Explainable AI to predict patient safety risks
and shows doctors *why* each decision was made, using SHAP-style explanations.

---

## ▶️ How to Run (VS Code)

### Step 1 — Install Python packages
Open VS Code terminal (`Ctrl + `` ` ``) and run:
```bash
pip install -r requirements.txt
```

### Step 2 — Start the Flask server
```bash
python app.py
```

### Step 3 — Open in browser
Visit: **http://127.0.0.1:5000**

---

## 📁 Project Structure

```
xai_webapp/
├── app.py                    ← Flask backend (AI model + API)
├── requirements.txt          ← Python dependencies
├── templates/
│   └── index.html            ← Full dashboard UI
├── static/
│   └── js/
│       └── app.js            ← Frontend JavaScript
└── .vscode/
    └── launch.json           ← VS Code run config
```

---

## 🌐 Web App Pages

| Page | Description |
|------|-------------|
| **Dashboard** | Model metrics, XAI overview, quick-start guide |
| **Analyze Patient** | Enter patient data → get risk score + SHAP chart |
| **Batch Analysis** | Analyze 20 patients at once, sorted by risk |
| **Model Insights** | Global feature importance, model performance stats |

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Main dashboard |
| `/api/model-status` | GET | Model training metrics |
| `/api/train` | POST | Retrain the model |
| `/api/analyze` | POST | Analyze a single patient |
| `/api/random-patient` | GET | Generate random patient data |
| `/api/batch-analyze` | POST | Analyze 20 patients at once |

---

## 🧠 How XAI Works

1. **Random Forest** (200 trees, depth 8) trained on 300 synthetic patients
2. **SHAP Feature Perturbation** — replace each feature with baseline → measure risk change
3. **Global Importance** — RF impurity-based feature importance across all patients
4. **Clinical Recommendations** — generated from top risk factors

---

*For educational/research purposes. Always consult qualified healthcare professionals.*
