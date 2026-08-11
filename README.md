# Notenmanager

Schweizer Notenmanager für BM (Berufsmaturität) und Berufsschule.

Eine schlanke Web-App zur Verwaltung von Schulnoten nach Fach, Semester und
Schuljahr. Alle Daten werden ausschliesslich lokal im Browser gespeichert
(LocalStorage) — es gibt keinen Server und keine externen APIs.

## Verwendung

Die App besteht aus statischem HTML/CSS/JavaScript und benötigt keinen
Build-Schritt. Einfach `index.html` in einem modernen Browser öffnen, oder
lokal per einfachem HTTP-Server ausliefern, z.B.:

```bash
python3 -m http.server 8080
# dann im Browser: http://localhost:8080
```

## Funktionen

- Umschalten zwischen Schultyp BM und Berufsschule (jeweils eigene Fächerliste)
- Schuljahre im Format `2024/25` mit Semestern H1 und H2, frei erweiterbar
- Fächer selbst hinzufügen und löschen
- Noten mit Notentyp, Wert (1.0–6.0), Gewichtung und Semester erfassen,
  bearbeiten und löschen
- Automatisch berechneter gewichteter Durchschnitt pro Fach und Semester
- PDF-Export pro Semester (zeugnisähnliche Tabelle inkl. Unterschriftszeile)
- JSON-Backup exportieren/importieren
- Ganzes Schuljahr löschen
- Einfaches Diagramm des Notenverlaufs über Semester hinweg

## Technik

- Vanilla HTML/CSS/JavaScript, keine Build-Tools
- PDF-Export mit [jsPDF](https://github.com/parallax/jsPDF) und
  [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable)
  (lokal unter `js/vendor/` eingebunden, MIT-lizenziert)
- Persistenz über `localStorage` im Browser

## Projektstruktur

```
index.html
css/style.css      Styling (mobile-first, max-width ~1000px)
js/storage.js      Datenmodell, LocalStorage, CRUD-Helfer
js/ui-helpers.js   Modal-Steuerung, Toast, Bestätigungsdialog
js/render.js       DOM-Rendering
js/pdf.js          PDF-Export
js/chart.js        Notenverlauf-Diagramm
js/main.js         App-Einstiegspunkt, Event-Wiring
js/vendor/         jsPDF + jspdf-autotable (lokal vendored)
```
