# Join

Statisches Kanban-Projekt (Vanilla HTML/CSS/JS, kein Build-Step, kein npm).

## Orientierung

**Lokal starten:** im Projekt-Root `python3 -m http.server` und im Browser
`http://localhost:8000/login.html` (Guest Log in) oder `http://localhost:8000/index.html`
öffnen. Kein Dev-Server, kein Watch-Mode.

**Dateikarte:**
- `login.html` — Einstieg fürs Board (Login/Signup/Guest); lädt `script.js` + `scripts/auth/*`
- `templates/board.html` — das Kanban-Board selbst; Scripts unter `scripts/board/*` und `scripts/tasks/*`
- `script.js` (Root) — globale Config, u. a. Firebase-Basis-URL (`DEFAULT_BASE_URL`)
- `templates/` — weitere Seiten (add-task, contacts, summary, help, legal)
- `styles/` — CSS parallel zu `scripts/` gegliedert (add-task, board, contacts, summary, login, welcome, components)
- `n8n/` — exportierte n8n-Workflows (E-Mail→Ticket, Statusbenachrichtigung) + eigenes README

**Firebase:** Realtime-Database-URL steht in `script.js` (`DEFAULT_BASE_URL`), keine Keys/Secrets
im Repo — Credentials liegen nur in n8n und Firebase selbst.

**Abweichende Konvention:** siehe debug.log-Pflicht unten — gilt zusätzlich zur globalen
Commit-Regel, nicht als Ersatz.

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
