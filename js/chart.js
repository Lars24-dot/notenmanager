/* chart.js — Einfaches Canvas-Liniendiagramm für den Notenverlauf über Semester hinweg */

function collectChartSubjects() {
  const names = new Set();
  sortedYears(AppState.data).forEach(sy => {
    sy[AppState.schoolType].subjects.forEach(s => names.add(s));
  });
  return [...names].sort((a, b) => a.localeCompare(b, 'de'));
}

function populateChartSubjectSelect() {
  const select = document.getElementById('chartSubjectSelect');
  const previous = select.value || '__overall__';
  select.innerHTML = '<option value="__overall__">Alle Fächer (Durchschnitt)</option>';
  collectChartSubjects().forEach(subject => {
    const opt = document.createElement('option');
    opt.value = subject;
    opt.textContent = subject;
    select.appendChild(opt);
  });
  select.value = [...select.options].some(o => o.value === previous) ? previous : '__overall__';
}

function buildChartDataPoints(subjectFilter) {
  const points = [];
  sortedYears(AppState.data).forEach(sy => {
    SEMESTERS.forEach(sem => {
      const branch = sy[AppState.schoolType];
      let avg;
      if (subjectFilter === '__overall__') {
        const subjectAverages = branch.subjects
          .map(subject => weightedAverage(branch.semesters[sem].filter(g => g.subject === subject)))
          .filter(a => a !== null);
        avg = subjectAverages.length ? subjectAverages.reduce((s, v) => s + v, 0) / subjectAverages.length : null;
      } else {
        const grades = branch.semesters[sem].filter(g => g.subject === subjectFilter);
        avg = weightedAverage(grades);
      }
      if (avg !== null) {
        points.push({ label: `${sy.year} ${semesterLabel(sem)}`, value: avg });
      }
    });
  });
  return points;
}

function drawChart(points) {
  const canvas = document.getElementById('chartCanvas');
  const ctx = canvas.getContext('2d');
  const emptyState = document.getElementById('chartEmptyState');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (points.length === 0) {
    emptyState.hidden = false;
    canvas.hidden = true;
    return;
  }
  emptyState.hidden = true;
  canvas.hidden = false;

  const padding = { top: 20, right: 24, bottom: 44, left: 44 };
  const w = canvas.width - padding.left - padding.right;
  const h = canvas.height - padding.top - padding.bottom;
  const minVal = 1, maxVal = 6;

  const xFor = (i) => padding.left + (points.length === 1 ? w / 2 : (i / (points.length - 1)) * w);
  const yFor = (v) => padding.top + h - ((v - minVal) / (maxVal - minVal)) * h;

  ctx.strokeStyle = '#d9dde3';
  ctx.fillStyle = '#6b7280';
  ctx.font = '11px system-ui, sans-serif';
  ctx.lineWidth = 1;
  for (let g = minVal; g <= maxVal; g++) {
    const y = yFor(g);
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + w, y);
    ctx.stroke();
    ctx.fillText(String(g), 8, y + 4);
  }

  ctx.fillStyle = '#374151';
  points.forEach((p, i) => {
    const x = xFor(i);
    ctx.save();
    ctx.translate(x, padding.top + h + 14);
    ctx.textAlign = 'center';
    ctx.fillText(p.label, 0, 0);
    ctx.restore();
  });

  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = xFor(i), y = yFor(p.value);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();

  ctx.fillStyle = '#2563eb';
  points.forEach((p, i) => {
    const x = xFor(i), y = yFor(p.value);
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#111827';
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText(p.value.toFixed(2), x, y - 10);
    ctx.fillStyle = '#2563eb';
  });
}

function renderChartForCurrentSelection() {
  const select = document.getElementById('chartSubjectSelect');
  const points = buildChartDataPoints(select.value);
  drawChart(points);
}

function openChartModal() {
  populateChartSubjectSelect();
  renderChartForCurrentSelection();
  openModal('chartModal');
}
