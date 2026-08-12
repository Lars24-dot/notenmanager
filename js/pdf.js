/* pdf.js — PDF-Export pro Semester mittels jsPDF + jspdf-autotable */

function exportSemesterPdf() {
  const branch = currentBranch();
  if (!branch || branch.subjects.length === 0) {
    showToast('Keine Fächer zum Exportieren vorhanden.', 'error');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 16;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Notenübersicht', marginX, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Schuljahr: ${AppState.year} — Semester: ${semesterLabel(AppState.semester)}`, marginX, 28);
  doc.text(`Schultyp: ${schoolTypeLabel(AppState.schoolType)}`, marginX, 34);

  const rows = branch.subjects.map(subject => {
    const grades = branch.semesters[AppState.semester]
      .filter(g => g.subject === subject)
      .sort((a, b) => a.timestamp - b.timestamp);
    const gradesText = grades.length
      ? grades.map(g => `${g.type} ${Number(g.note).toFixed(2)}`).join(', ')
      : '—';
    const avg = weightedAverage(grades);
    return [subject, gradesText, formatAverage(avg)];
  });

  doc.autoTable({
    startY: 40,
    head: [['Fach', 'Noten', 'Durchschnitt']],
    body: rows,
    margin: { left: marginX, right: marginX },
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 3, valign: 'middle' },
    headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 28, halign: 'center' }
    },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  });

  const finalY = doc.lastAutoTable.finalY + 10;
  const subjectAverages = branch.subjects
    .map(subject => weightedAverage(branch.semesters[AppState.semester].filter(g => g.subject === subject)))
    .filter(a => a !== null);
  const overall = subjectAverages.length
    ? subjectAverages.reduce((s, v) => s + v, 0) / subjectAverages.length
    : null;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Durchschnitt aller Fächer: ${formatAverage(overall)}`, marginX, finalY);

  const fileName = `Notenuebersicht_${AppState.year.replace('/', '-')}_${semesterLabel(AppState.semester)}_${AppState.schoolType}.pdf`;
  doc.save(fileName);
  showToast('PDF wurde exportiert.');
}
