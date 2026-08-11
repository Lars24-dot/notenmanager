/* main.js — App-Einstiegspunkt: State, Event-Wiring */

const AppState = {
  data: null,
  schoolType: 'bm',
  year: null,
  semester: 'H1'
};

function persistUIState() {
  saveUIState({ schoolType: AppState.schoolType, year: AppState.year, semester: AppState.semester });
}

function initState() {
  AppState.data = loadData();
  const ui = loadUIState();
  const years = sortedYears(AppState.data);
  const latestYear = years.length ? years[years.length - 1].year : currentSwissSchoolYear();

  AppState.schoolType = ui && SCHOOL_TYPES.includes(ui.schoolType) ? ui.schoolType : 'bm';
  AppState.semester = ui && SEMESTERS.includes(ui.semester) ? ui.semester : 'H1';
  AppState.year = ui && ui.year && findSchoolYear(AppState.data, ui.year) ? ui.year : latestYear;
}

/* ---------- Schultyp / Jahr / Semester Navigation ---------- */

function initNavigationHandlers() {
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      AppState.schoolType = btn.getAttribute('data-school-type');
      persistUIState();
      renderAll();
    });
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      AppState.semester = btn.getAttribute('data-semester');
      persistUIState();
      renderAll();
    });
  });

  document.getElementById('yearSelect').addEventListener('change', (e) => {
    AppState.year = e.target.value;
    persistUIState();
    renderAll();
  });

  document.getElementById('prevYearBtn').addEventListener('click', () => {
    const years = sortedYears(AppState.data);
    const idx = years.findIndex(sy => sy.year === AppState.year);
    if (idx > 0) {
      AppState.year = years[idx - 1].year;
      persistUIState();
      renderAll();
    }
  });

  document.getElementById('nextYearBtn').addEventListener('click', () => {
    const years = sortedYears(AppState.data);
    const idx = years.findIndex(sy => sy.year === AppState.year);
    if (idx !== -1 && idx < years.length - 1) {
      AppState.year = years[idx + 1].year;
      persistUIState();
      renderAll();
    }
  });

  document.getElementById('addYearBtn').addEventListener('click', () => {
    const suggestion = suggestNextYear();
    const input = window.prompt('Neues Schuljahr (Format JJJJ/JJ):', suggestion);
    if (input === null) return;
    try {
      addSchoolYear(AppState.data, input.trim());
      AppState.year = input.trim();
      persistUIState();
      renderAll();
      showToast('Schuljahr hinzugefügt.');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  document.getElementById('deleteYearBtn').addEventListener('click', async () => {
    const confirmed = await confirmDialog(
      `Schuljahr ${AppState.year} inkl. aller Noten und Fächer unwiderruflich löschen?`,
      { title: 'Schuljahr löschen' }
    );
    if (!confirmed) return;
    removeSchoolYear(AppState.data, AppState.year);
    const years = sortedYears(AppState.data);
    if (years.length === 0) {
      getOrCreateSchoolYear(AppState.data, currentSwissSchoolYear());
      saveData(AppState.data);
    }
    const remaining = sortedYears(AppState.data);
    AppState.year = remaining[remaining.length - 1].year;
    persistUIState();
    renderAll();
    showToast('Schuljahr gelöscht.');
  });
}

function suggestNextYear() {
  const years = sortedYears(AppState.data);
  if (years.length === 0) return currentSwissSchoolYear();
  const lastStart = parseYearStart(years[years.length - 1].year);
  const nextStart = lastStart + 1;
  return `${nextStart}/${String((nextStart + 1) % 100).padStart(2, '0')}`;
}

/* ---------- Noten: Hinzufügen / Bearbeiten / Löschen ---------- */

function openGradeModalForAdd(preselectSubject) {
  const branch = currentBranch();
  if (!branch || branch.subjects.length === 0) {
    showToast('Bitte zuerst ein Fach hinzufügen.', 'error');
    return;
  }
  document.getElementById('gradeModalTitle').textContent = 'Note hinzufügen';
  document.getElementById('gradeForm').reset();
  document.getElementById('gradeId').value = '';
  populateGradeSubjectSelect(preselectSubject);
  document.getElementById('gradeType').value = '';
  document.getElementById('gradeValue').value = '5.0';
  document.getElementById('gradeWeight').value = '1';
  document.getElementById('gradeSemester').value = AppState.semester;
  document.getElementById('gradeYear').value = AppState.year;
  openModal('gradeModal');
}

function openGradeModalForEdit(grade) {
  document.getElementById('gradeModalTitle').textContent = 'Note bearbeiten';
  populateGradeSubjectSelect(grade.subject);
  document.getElementById('gradeId').value = grade.id;
  document.getElementById('gradeType').value = grade.type;
  document.getElementById('gradeValue').value = grade.note;
  document.getElementById('gradeWeight').value = grade.weight;
  document.getElementById('gradeSemester').value = AppState.semester;
  document.getElementById('gradeYear').value = AppState.year;
  openModal('gradeModal');
}

function initGradeFormHandler() {
  document.getElementById('gradeForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const id = document.getElementById('gradeId').value;
    const subject = document.getElementById('gradeSubject').value;
    const type = document.getElementById('gradeType').value.trim();
    const note = parseFloat(document.getElementById('gradeValue').value);
    const weight = parseFloat(document.getElementById('gradeWeight').value);
    const semester = document.getElementById('gradeSemester').value;

    if (!subject || !type) {
      showToast('Bitte alle Felder ausfüllen.', 'error');
      return;
    }
    if (Number.isNaN(note) || note < 1 || note > 6) {
      showToast('Note muss zwischen 1.0 und 6.0 liegen.', 'error');
      return;
    }
    if (Number.isNaN(weight) || weight <= 0) {
      showToast('Gewichtung muss eine positive Zahl sein.', 'error');
      return;
    }

    if (id) {
      updateGrade(AppState.data, AppState.year, AppState.schoolType, AppState.semester, id, {
        subject, type, note, weight
      });
      showToast('Note aktualisiert.');
    } else {
      addGrade(AppState.data, AppState.year, AppState.schoolType, semester, { subject, type, note, weight });
      showToast('Note hinzugefügt.');
    }

    closeModal('gradeModal');
    if (semester !== AppState.semester && !id) {
      AppState.semester = semester;
      persistUIState();
    }
    renderAll();
  });
}

async function handleDeleteGrade(grade) {
  const confirmed = await confirmDialog(
    `Note "${grade.type}" (${Number(grade.note).toFixed(1)}) für ${grade.subject} löschen?`,
    { title: 'Note löschen' }
  );
  if (!confirmed) return;
  removeGrade(AppState.data, AppState.year, AppState.schoolType, AppState.semester, grade.id);
  renderAll();
  showToast('Note gelöscht.');
}

/* ---------- Fächer verwalten ---------- */

function initSubjectHandlers() {
  document.getElementById('addSubjectBtn').addEventListener('click', () => {
    renderSubjectModalList();
    document.getElementById('newSubjectName').value = '';
    openModal('subjectModal');
  });

  document.getElementById('subjectForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('newSubjectName');
    try {
      addSubject(AppState.data, AppState.year, AppState.schoolType, input.value);
      input.value = '';
      renderSubjectModalList();
      renderSubjects();
      showToast('Fach hinzugefügt.');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

async function handleDeleteSubject(subject) {
  const confirmed = await confirmDialog(
    `Fach "${subject}" inkl. aller zugehörigen Noten in diesem Schuljahr löschen?`,
    { title: 'Fach löschen' }
  );
  if (!confirmed) return;
  removeSubject(AppState.data, AppState.year, AppState.schoolType, subject);
  renderSubjectModalList();
  renderSubjects();
  showToast('Fach gelöscht.');
}

/* ---------- PDF / JSON Import-Export ---------- */

function initExportImportHandlers() {
  document.getElementById('exportPdfBtn').addEventListener('click', exportSemesterPdf);

  document.getElementById('exportJsonBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(AppState.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notenmanager-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Backup exportiert.');
  });

  document.getElementById('importJsonBtn').addEventListener('click', () => {
    document.getElementById('importJsonInput').click();
  });

  document.getElementById('importJsonInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || !Array.isArray(parsed.schoolYears)) throw new Error('Ungültiges Datenformat.');

      const confirmed = await confirmDialog(
        'Dies überschreibt alle aktuellen Daten mit dem Inhalt der Backup-Datei. Fortfahren?',
        { title: 'Backup importieren', okLabel: 'Importieren' }
      );
      if (!confirmed) return;

      AppState.data = parsed;
      saveData(AppState.data);
      const years = sortedYears(AppState.data);
      AppState.year = years.length ? years[years.length - 1].year : currentSwissSchoolYear();
      persistUIState();
      renderAll();
      showToast('Backup importiert.');
    } catch (err) {
      showToast('Import fehlgeschlagen: ' + err.message, 'error');
    }
  });
}

/* ---------- Chart ---------- */

function initChartHandlers() {
  document.getElementById('chartBtn').addEventListener('click', openChartModal);
  document.getElementById('chartSubjectSelect').addEventListener('change', renderChartForCurrentSelection);
}

/* ---------- Init ---------- */

document.addEventListener('DOMContentLoaded', () => {
  initState();
  initModalDismissHandlers();
  initConfirmDialogHandlers();
  initNavigationHandlers();
  initGradeFormHandler();
  initSubjectHandlers();
  initExportImportHandlers();
  initChartHandlers();

  document.getElementById('addGradeBtn').addEventListener('click', () => openGradeModalForAdd());

  renderAll();
});
