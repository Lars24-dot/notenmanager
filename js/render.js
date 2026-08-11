/* render.js — DOM-Rendering für Notenmanager */

function renderAll() {
  ensureValidSelection();
  renderSchoolTypeToggle();
  renderYearSelect();
  renderSemesterTabs();
  renderSubjects();
}

function ensureValidSelection() {
  if (!findSchoolYear(AppState.data, AppState.year)) {
    const years = sortedYears(AppState.data);
    AppState.year = years.length ? years[years.length - 1].year : currentSwissSchoolYear();
    if (!findSchoolYear(AppState.data, AppState.year)) {
      getOrCreateSchoolYear(AppState.data, AppState.year);
      saveData(AppState.data);
    }
  }
}

function renderSchoolTypeToggle() {
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    const active = btn.getAttribute('data-school-type') === AppState.schoolType;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
  });
}

function renderYearSelect() {
  const select = document.getElementById('yearSelect');
  const years = sortedYears(AppState.data);
  select.innerHTML = '';
  years.forEach(sy => {
    const opt = document.createElement('option');
    opt.value = sy.year;
    opt.textContent = sy.year;
    if (sy.year === AppState.year) opt.selected = true;
    select.appendChild(opt);
  });

  const idx = years.findIndex(sy => sy.year === AppState.year);
  document.getElementById('prevYearBtn').disabled = idx <= 0;
  document.getElementById('nextYearBtn').disabled = idx === -1 || idx >= years.length - 1;
}

function renderSemesterTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    const active = btn.getAttribute('data-semester') === AppState.semester;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
  });
}

function currentBranch() {
  const sy = findSchoolYear(AppState.data, AppState.year);
  return sy ? sy[AppState.schoolType] : null;
}

function currentSemesterGrades(subject) {
  const branch = currentBranch();
  if (!branch) return [];
  return branch.semesters[AppState.semester].filter(g => g.subject === subject);
}

function renderSubjects() {
  const container = document.getElementById('subjectsContainer');
  const emptyState = document.getElementById('emptyState');
  container.innerHTML = '';

  const branch = currentBranch();
  const subjects = branch ? branch.subjects : [];

  if (subjects.length === 0) {
    emptyState.hidden = false;
    renderOverallAverage([]);
    return;
  }
  emptyState.hidden = true;

  const allGrades = [];

  subjects.forEach(subject => {
    const grades = currentSemesterGrades(subject).sort((a, b) => a.timestamp - b.timestamp);
    allGrades.push(...grades);
    container.appendChild(renderSubjectCard(subject, grades));
  });

  renderOverallAverage(allGrades, subjects.map(s => currentSemesterGrades(s)));
}

function renderSubjectCard(subject, grades) {
  const card = document.createElement('article');
  card.className = 'subject-card';

  const header = document.createElement('div');
  header.className = 'subject-card-header';

  const title = document.createElement('h3');
  title.className = 'subject-name';
  title.textContent = subject;

  const avg = weightedAverage(grades);
  const avgBadge = document.createElement('span');
  avgBadge.className = 'avg-badge' + (avg !== null ? gradeAvgClass(avg) : '');
  avgBadge.textContent = formatAverage(avg);
  avgBadge.title = 'Gewichteter Durchschnitt';

  header.appendChild(title);
  header.appendChild(avgBadge);
  card.appendChild(header);

  if (grades.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'no-grades';
    empty.textContent = 'Noch keine Noten in diesem Semester.';
    card.appendChild(empty);
  } else {
    const table = document.createElement('table');
    table.className = 'grade-table';
    table.innerHTML = `
      <thead>
        <tr><th>Typ</th><th>Note</th><th>Gewichtung</th><th></th></tr>
      </thead>
    `;
    const tbody = document.createElement('tbody');
    grades.forEach(g => {
      const tr = document.createElement('tr');

      const tdType = document.createElement('td');
      tdType.textContent = g.type;

      const tdNote = document.createElement('td');
      tdNote.textContent = Number(g.note).toFixed(2);
      tdNote.className = 'grade-note' + gradeAvgClass(Number(g.note));

      const tdWeight = document.createElement('td');
      tdWeight.textContent = String(g.weight);

      const tdActions = document.createElement('td');
      tdActions.className = 'row-actions';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'icon-btn small';
      editBtn.setAttribute('aria-label', 'Note bearbeiten');
      editBtn.textContent = '✎';
      editBtn.addEventListener('click', () => openGradeModalForEdit(g));

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'icon-btn small danger';
      delBtn.setAttribute('aria-label', 'Note löschen');
      delBtn.textContent = '✕';
      delBtn.addEventListener('click', () => handleDeleteGrade(g));

      tdActions.appendChild(editBtn);
      tdActions.appendChild(delBtn);

      tr.appendChild(tdType);
      tr.appendChild(tdNote);
      tr.appendChild(tdWeight);
      tr.appendChild(tdActions);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    card.appendChild(table);
  }

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'btn btn-secondary btn-small';
  addBtn.textContent = '+ Note für ' + subject;
  addBtn.addEventListener('click', () => openGradeModalForAdd(subject));
  card.appendChild(addBtn);

  return card;
}

function gradeAvgClass(value) {
  if (value >= 5) return ' grade-good';
  if (value >= 4) return ' grade-ok';
  return ' grade-bad';
}

function renderOverallAverage(allGrades, perSubjectGradeLists = []) {
  const el = document.getElementById('overallAverage');
  if (!perSubjectGradeLists.length) {
    el.textContent = '–';
    return;
  }
  const subjectAverages = perSubjectGradeLists
    .map(list => weightedAverage(list))
    .filter(avg => avg !== null);
  if (subjectAverages.length === 0) {
    el.textContent = '–';
    return;
  }
  const overall = subjectAverages.reduce((s, v) => s + v, 0) / subjectAverages.length;
  el.textContent = formatAverage(overall);
  el.className = 'summary-value' + gradeAvgClass(overall);
}

function populateGradeSubjectSelect(selectedSubject) {
  const select = document.getElementById('gradeSubject');
  const branch = currentBranch();
  const subjects = branch ? branch.subjects : [];
  select.innerHTML = '';
  subjects.forEach(subject => {
    const opt = document.createElement('option');
    opt.value = subject;
    opt.textContent = subject;
    if (subject === selectedSubject) opt.selected = true;
    select.appendChild(opt);
  });
}

function renderSubjectModalList() {
  const list = document.getElementById('subjectList');
  const branch = currentBranch();
  const subjects = branch ? branch.subjects : [];
  list.innerHTML = '';

  if (subjects.length === 0) {
    const li = document.createElement('li');
    li.className = 'subject-list-empty';
    li.textContent = 'Noch keine Fächer vorhanden.';
    list.appendChild(li);
    return;
  }

  subjects.forEach(subject => {
    const li = document.createElement('li');
    li.className = 'subject-list-item';

    const name = document.createElement('span');
    name.textContent = subject;

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'icon-btn small danger';
    delBtn.setAttribute('aria-label', 'Fach löschen');
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', () => handleDeleteSubject(subject));

    li.appendChild(name);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}
