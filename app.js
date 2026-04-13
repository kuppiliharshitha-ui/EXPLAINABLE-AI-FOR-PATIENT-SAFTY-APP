// ─────────────────────────────────────────────
//  XAI Patient Safety — Frontend JS
// ─────────────────────────────────────────────

// ── Page Navigation ──────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    if (n.textContent.toLowerCase().includes(
      {dashboard:'dashboard', analyze:'analyze', batch:'batch', model:'model'}[name]
    )) n.classList.add('active');
  });
}

// ── Toast ─────────────────────────────────────
function toast(msg, duration = 3000) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, duration);
}

// ── Toggle Buttons ────────────────────────────
function toggle(id) {
  const btn = document.getElementById(id);
  btn.classList.toggle('on');
}
function toggleVal(id) {
  return document.getElementById(id).classList.contains('on') ? 1 : 0;
}

// ── Reset Form ────────────────────────────────
function resetForm() {
  document.getElementById('f-age').value    = 62;
  document.getElementById('f-sbp').value    = 138;
  document.getElementById('f-dbp').value    = 88;
  document.getElementById('f-hr').value     = 82;
  document.getElementById('f-temp').value   = 37.1;
  document.getElementById('f-o2').value     = 96;
  document.getElementById('f-glucose').value= 110;
  document.getElementById('f-creat').value  = 1.1;
  document.getElementById('f-wbc').value    = 7.8;
  document.getElementById('f-hgb').value    = 13.2;
  document.getElementById('f-meds').value   = 3;
  document.getElementById('f-diag').value   = 2;
  ['t-diabetes','t-hypertension','t-heart','t-kidney','t-anticoag',
   't-falls','t-surgery','t-icu'].forEach(id => {
    document.getElementById(id).classList.remove('on');
  });
  document.getElementById('result-panel').style.display = 'none';
}

// ── Load Random Patient ───────────────────────
async function loadRandom() {
  try {
    const r = await fetch('/api/random-patient');
    const p = await r.json();
    document.getElementById('f-age').value    = p.age;
    document.getElementById('f-sbp').value    = p.systolic_bp;
    document.getElementById('f-dbp').value    = p.diastolic_bp;
    document.getElementById('f-hr').value     = p.heart_rate;
    document.getElementById('f-temp').value   = p.temperature;
    document.getElementById('f-o2').value     = p.oxygen_saturation;
    document.getElementById('f-glucose').value= p.blood_glucose;
    document.getElementById('f-creat').value  = p.creatinine;
    document.getElementById('f-wbc').value    = p.wbc_count;
    document.getElementById('f-hgb').value    = p.hemoglobin;
    document.getElementById('f-meds').value   = p.num_medications;
    document.getElementById('f-diag').value   = p.num_diagnoses;

    const map = {
      't-diabetes': 'diabetes', 't-hypertension': 'hypertension',
      't-heart': 'heart_disease', 't-kidney': 'kidney_disease',
      't-anticoag': 'anticoagulant_use', 't-falls': 'recent_falls',
      't-surgery': 'surgery_within_30d', 't-icu': 'icu_admission'
    };
    Object.entries(map).forEach(([tid, key]) => {
      const btn = document.getElementById(tid);
      p[key] ? btn.classList.add('on') : btn.classList.remove('on');
    });

    toast(`✅ Loaded: ${p.name}, Age ${p.age}`);
  } catch(e) {
    toast('❌ Could not load random patient.');
  }
}

// ── Analyze Patient ───────────────────────────
async function analyzePatient() {
  const btn = document.getElementById('btn-analyze');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Analyzing...';

  const payload = {
    age:               parseFloat(document.getElementById('f-age').value),
    systolic_bp:       parseFloat(document.getElementById('f-sbp').value),
    diastolic_bp:      parseFloat(document.getElementById('f-dbp').value),
    heart_rate:        parseFloat(document.getElementById('f-hr').value),
    temperature:       parseFloat(document.getElementById('f-temp').value),
    oxygen_saturation: parseFloat(document.getElementById('f-o2').value),
    blood_glucose:     parseFloat(document.getElementById('f-glucose').value),
    creatinine:        parseFloat(document.getElementById('f-creat').value),
    wbc_count:         parseFloat(document.getElementById('f-wbc').value),
    hemoglobin:        parseFloat(document.getElementById('f-hgb').value),
    num_medications:   parseInt(document.getElementById('f-meds').value),
    num_diagnoses:     parseInt(document.getElementById('f-diag').value),
    diabetes:          toggleVal('t-diabetes'),
    hypertension:      toggleVal('t-hypertension'),
    heart_disease:     toggleVal('t-heart'),
    kidney_disease:    toggleVal('t-kidney'),
    anticoagulant_use: toggleVal('t-anticoag'),
    recent_falls:      toggleVal('t-falls'),
    surgery_within_30d:toggleVal('t-surgery'),
    icu_admission:     toggleVal('t-icu'),
  };

  try {
    const r   = await fetch('/api/analyze', { method:'POST',
      headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const res = await r.json();

    if (res.error) { toast('❌ ' + res.error); return; }

    renderResult(res);
    document.getElementById('result-panel').style.display = 'block';
    document.getElementById('result-panel').scrollIntoView({ behavior:'smooth', block:'start' });
  } catch(e) {
    toast('❌ Server error. Is Flask running?');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🔬 Analyze Risk';
  }
}

// ── Render Result ─────────────────────────────
function renderResult(res) {
  const label = res.risk_label;
  const colors = { HIGH: '#ff4d6d', MEDIUM: '#ffd166', LOW: '#06d6a0' };
  const color  = colors[label];

  // Hero
  const hero  = document.getElementById('risk-hero');
  const gauge = document.getElementById('risk-gauge');
  const badge = document.getElementById('risk-badge');
  hero.className  = 'risk-hero ' + label;
  gauge.className = 'risk-gauge ' + label;
  badge.className = 'risk-label-badge ' + label;
  document.getElementById('risk-num').textContent  = res.risk_score;
  badge.textContent = label + ' RISK';
  document.getElementById('risk-rec').textContent  = res.recommendation;

  const al = document.getElementById('action-list');
  al.innerHTML = res.actions.map(a =>
    `<span class="action-tag">${a}</span>`
  ).join('');

  // SHAP chart
  const maxShap = Math.max(...res.shap_values.map(([,v]) => Math.abs(v)), 0.001);
  document.getElementById('shap-chart').innerHTML = res.shap_values.map(([feat, val]) => {
    const pct    = Math.min(Math.abs(val) / maxShap * 100, 100).toFixed(1);
    const isPos  = val >= 0;
    const cls    = isPos ? 'pos' : 'neg';
    const dir    = isPos ? '▲ increases' : '▼ decreases';
    return `
    <div class="shap-row">
      <div style="display:flex;justify-content:space-between;">
        <span class="shap-feat">${feat}</span>
        <span class="shap-dir ${cls}">${dir}</span>
      </div>
      <div class="shap-bar-wrap">
        <div class="shap-bar-track">
          <div class="shap-bar-fill ${cls}" style="width:${pct}%"></div>
        </div>
        <div class="shap-val">${val > 0 ? '+' : ''}${val.toFixed(3)}</div>
      </div>
    </div>`;
  }).join('');

  // Global importance
  const maxG = Math.max(...res.global_importance.map(([,v]) => v), 0.001);
  document.getElementById('global-chart').innerHTML = res.global_importance.slice(0,10).map(([feat, val]) => {
    const pct = (val / maxG * 100).toFixed(1);
    return `
    <div class="imp-row">
      <div style="display:flex;justify-content:space-between;">
        <span class="imp-feat">${feat}</span>
        <span class="imp-val">${val.toFixed(4)}</span>
      </div>
      <div class="imp-bar-bg">
        <div class="imp-bar-fill" style="width:${pct}%"></div>
      </div>
    </div>`;
  }).join('');
}

// ── Batch Analysis ────────────────────────────
async function runBatch() {
  const btn = document.getElementById('btn-batch');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Analyzing...';
  document.getElementById('batch-body').innerHTML =
    '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:40px;">Running AI analysis on 20 patients...</td></tr>';

  try {
    const r   = await fetch('/api/batch-analyze', { method:'POST' });
    const res = await r.json();
    if (res.error) { toast('❌ ' + res.error); return; }

    let high = 0, med = 0, low = 0;
    const colorMap = { HIGH:'#ff4d6d', MEDIUM:'#ffd166', LOW:'#06d6a0' };

    document.getElementById('batch-body').innerHTML = res.patients.map((p, i) => {
      if (p.risk_label === 'HIGH')   high++;
      else if (p.risk_label === 'MEDIUM') med++;
      else low++;
      const scoreColor = colorMap[p.risk_label];
      return `<tr>
        <td style="color:var(--muted);font-family:var(--mono);">${String(i+1).padStart(2,'0')}</td>
        <td style="font-weight:600;">${p.name}</td>
        <td>${p.age}</td>
        <td>
          <div class="score-bar-wrap">
            <div class="score-bar-bg">
              <div class="score-bar-fill" style="width:${p.risk_score}%;background:${scoreColor};"></div>
            </div>
            <span style="font-family:var(--mono);font-size:12px;min-width:36px;">${p.risk_score}%</span>
          </div>
        </td>
        <td><span class="risk-pill ${p.risk_label}">${p.risk_label}</span></td>
        <td style="color:var(--muted);font-size:12px;">${p.top_factor}</td>
      </tr>`;
    }).join('');

    document.getElementById('bs-high').textContent = high;
    document.getElementById('bs-med').textContent  = med;
    document.getElementById('bs-low').textContent  = low;
    document.getElementById('batch-summary').style.display = 'block';
    toast(`✅ Analyzed 20 patients: ${high} high, ${med} medium, ${low} low risk`);

  } catch(e) {
    toast('❌ Server error during batch analysis.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '▶ Run Batch Analysis';
  }
}

// ── Retrain ───────────────────────────────────
async function retrain() {
  toast('🔄 Retraining model...');
  try {
    const r = await fetch('/api/train', { method:'POST' });
    const res = await r.json();
    if (res.success) {
      updateMetrics(res.metrics);
      toast('✅ Model retrained successfully!');
    }
  } catch(e) {
    toast('❌ Retrain failed.');
  }
}

// ── Update Metrics ─────────────────────────────
function updateMetrics(m) {
  if (!m) return;
  ['dash-auc','dash-f1','dash-prec'].forEach((id, i) => {
    const val = [m.auc, m.f1, m.precision][i];
    if (document.getElementById(id))
      document.getElementById(id).textContent = val ? val.toFixed(4) : '—';
  });
  if (document.getElementById('dash-n'))
    document.getElementById('dash-n').textContent = m.n_patients || '—';

  ['m-auc','m-f1','m-prec','m-rec','m-n'].forEach((id, i) => {
    const val = [m.auc, m.f1, m.precision, m.recall, m.n_patients][i];
    if (document.getElementById(id))
      document.getElementById(id).textContent = val ? (i < 4 ? val.toFixed(4) : val) : '—';
  });

  // Model status in sidebar
  document.getElementById('status-dot').classList.add('ready');
  document.getElementById('status-text').textContent = 'Model Ready';
  if (m.auc) document.getElementById('status-auc').textContent = 'AUC: ' + m.auc.toFixed(4);
}

// ── Load Model Info for Model Page ────────────
async function loadModelInfo() {
  try {
    const r   = await fetch('/api/model-status');
    const res = await r.json();
    updateMetrics(res.metrics);
  } catch(e) {}
}

// ── Render Model Importance Chart ─────────────
async function renderModelImportance() {
  // Do a dummy analyze to get global importance
  try {
    const r = await fetch('/api/analyze', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        age:62, systolic_bp:130, diastolic_bp:82, heart_rate:78,
        temperature:37.0, oxygen_saturation:97, blood_glucose:105,
        creatinine:1.0, wbc_count:7.5, hemoglobin:13.0,
        num_medications:3, num_diagnoses:2,
        recent_falls:0, surgery_within_30d:0, icu_admission:0,
        diabetes:0, hypertension:0, heart_disease:0, kidney_disease:0, anticoagulant_use:0
      })
    });
    const res = await r.json();
    if (!res.global_importance) return;

    const maxG = Math.max(...res.global_importance.map(([,v]) => v), 0.001);
    document.getElementById('model-importance-chart').innerHTML =
      res.global_importance.slice(0, 10).map(([feat, val]) => {
        const pct = (val / maxG * 100).toFixed(1);
        return `
        <div class="imp-row">
          <div style="display:flex;justify-content:space-between;">
            <span class="imp-feat">${feat}</span>
            <span class="imp-val">${val.toFixed(4)}</span>
          </div>
          <div class="imp-bar-bg">
            <div class="imp-bar-fill" style="width:${pct}%"></div>
          </div>
        </div>`;
      }).join('');
  } catch(e) {}
}

// ── Init ──────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  await loadModelInfo();
  await renderModelImportance();
});
