# Join

Statisches Kanban-Projekt (Vanilla HTML/CSS/JS, kein Build-Step, kein npm).

## debug.log-Pflicht

Jede Code-Änderung an diesem Projekt bekommt einen neuen Eintrag in `debug.log`
(Projekt-Root) — unabhängig von der Aufgabe, immer.

- Ein Eintrag pro Commit: bevor committet wird, den entsprechenden `debug.log`-
  Eintrag fertig schreiben, damit er 1:1 zu diesem einen Commit passt (kein
  Sammel-Eintrag über mehrere Commits hinweg, kein Commit ohne Eintrag).
- Format pro Eintrag: `[YYYY-MM-DD] Kurzer Titel`, danach in einfachen,
  laienverständlichen Stichpunkten was geändert wurde, warum, und welche Dateien
  betroffen sind. Neuester Eintrag immer oben.
- Zielgruppe ist der Projektinhaber, nicht andere Entwickler — keine Fachbegriffe
  ohne kurze Erklärung, kein Code-Diff-Jargon.
