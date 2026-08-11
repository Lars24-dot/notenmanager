/* storage.js — Datenmodell, LocalStorage-Persistierung und CRUD-Helfer */

const STORAGE_KEY = 'notenmanager.data.v1';
const UI_STATE_KEY = 'notenmanager.ui.v1';

const SCHOOL_TYPES = ['bm', 'vocational'];
const SEMESTERS = ['H1', 'H2'];

const DEFAULT_SUBJECTS = {
  bm: ['Mathematik', 'Deutsch', 'Englisch', 'Französisch', 'Wirtschaft & Recht', 'Geschichte & Politik'],
  vocational: ['Berufskunde', 'ABU', 'Sport']
};

function currentSwissSchoolYear() {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed, 7 = August
  const startYear = month >= 7 ? now.getFullYear() : now.getFullYear() - 1;
  const endYearShort = String((startYear + 1) % 100).padStart(2, '0');
  return `${startYear}/${endYearShort}`;
}

function emptySemesters() {
  return { H1: [], H2: [] };
}

function createSchoolYear(year) {
  return {
    year,
    bm: { subjects: [...DEFAULT_SUBJECTS.bm], semesters: emptySemesters() },
    vocational: { subjects: [...DEFAULT_SUBJECTS.vocational], semesters: emptySemesters() }
  };
}

function defaultData() {
  return { schoolYears: [createSchoolYear(currentSwissSchoolYear())] };
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = defaultData();
      saveData(fresh);
      return fresh;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.schoolYears)) throw new Error('invalid shape');
    return parsed;
  } catch (err) {
    console.error('Fehler beim Laden der Daten, verwende Standarddaten.', err);
    const fresh = defaultData();
    saveData(fresh);
    return fresh;
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadUIState() {
  try {
    const raw = localStorage.getItem(UI_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function saveUIState(state) {
  localStorage.setItem(UI_STATE_KEY, JSON.stringify(state));
}

function sortedYears(data) {
  return [...data.schoolYears].sort((a, b) => parseYearStart(a.year) - parseYearStart(b.year));
}

function parseYearStart(year) {
  const match = /^(\d{4})/.exec(year);
  return match ? parseInt(match[1], 10) : 0;
}

function findSchoolYear(data, year) {
  return data.schoolYears.find(sy => sy.year === year) || null;
}

function getOrCreateSchoolYear(data, year) {
  let sy = findSchoolYear(data, year);
  if (!sy) {
    sy = createSchoolYear(year);
    data.schoolYears.push(sy);
  }
  return sy;
}

function isValidYearFormat(year) {
  return /^\d{4}\/\d{2}$/.test(year);
}

function addSchoolYear(data, year) {
  if (!isValidYearFormat(year)) throw new Error('Ungültiges Format. Bitte im Format JJJJ/JJ angeben, z.B. 2025/26.');
  if (findSchoolYear(data, year)) throw new Error('Dieses Schuljahr existiert bereits.');
  const sy = createSchoolYear(year);
  data.schoolYears.push(sy);
  saveData(data);
  return sy;
}

function removeSchoolYear(data, year) {
  data.schoolYears = data.schoolYears.filter(sy => sy.year !== year);
  saveData(data);
}

function addSubject(data, year, schoolType, name) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Fachname darf nicht leer sein.');
  const sy = getOrCreateSchoolYear(data, year);
  const branch = sy[schoolType];
  if (branch.subjects.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error('Dieses Fach existiert bereits.');
  }
  branch.subjects.push(trimmed);
  saveData(data);
}

function removeSubject(data, year, schoolType, name) {
  const sy = findSchoolYear(data, year);
  if (!sy) return;
  const branch = sy[schoolType];
  branch.subjects = branch.subjects.filter(s => s !== name);
  SEMESTERS.forEach(sem => {
    branch.semesters[sem] = branch.semesters[sem].filter(g => g.subject !== name);
  });
  saveData(data);
}

function addGrade(data, year, schoolType, semester, grade) {
  const sy = getOrCreateSchoolYear(data, year);
  const branch = sy[schoolType];
  const entry = {
    id: 'g_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    subject: grade.subject,
    type: grade.type,
    note: grade.note,
    weight: grade.weight,
    timestamp: Date.now()
  };
  branch.semesters[semester].push(entry);
  saveData(data);
  return entry;
}

function updateGrade(data, year, schoolType, semester, gradeId, updates) {
  const sy = findSchoolYear(data, year);
  if (!sy) return;
  const branch = sy[schoolType];
  const list = branch.semesters[semester];
  const idx = list.findIndex(g => g.id === gradeId);
  if (idx === -1) return;
  list[idx] = { ...list[idx], ...updates };
  saveData(data);
}

function removeGrade(data, year, schoolType, semester, gradeId) {
  const sy = findSchoolYear(data, year);
  if (!sy) return;
  const branch = sy[schoolType];
  branch.semesters[semester] = branch.semesters[semester].filter(g => g.id !== gradeId);
  saveData(data);
}

function findGrade(data, year, schoolType, semester, gradeId) {
  const sy = findSchoolYear(data, year);
  if (!sy) return null;
  return sy[schoolType].semesters[semester].find(g => g.id === gradeId) || null;
}

function weightedAverage(grades) {
  if (!grades || grades.length === 0) return null;
  const totalWeight = grades.reduce((sum, g) => sum + Number(g.weight), 0);
  if (totalWeight === 0) return null;
  const weightedSum = grades.reduce((sum, g) => sum + Number(g.note) * Number(g.weight), 0);
  return weightedSum / totalWeight;
}

function formatAverage(avg) {
  return avg === null || avg === undefined || Number.isNaN(avg) ? '–' : avg.toFixed(2);
}

function schoolTypeLabel(schoolType) {
  return schoolType === 'bm' ? 'Berufsmaturität (BM)' : 'Berufsschule';
}
