# n8n-Workflows

Exportierte Workflows des Join Issue Collectors. Sie laufen auf der n8n-Instanz
des Homeservers und werden über die n8n Public API eingespielt.

## issue-collector.json

Holt Mails aus dem Postfach `join-issues@gmx.de`, lässt sie von Google Gemini
analysieren und legt daraus ein Ticket in der Triage-Spalte des Join-Boards an.

| Node | Aufgabe |
|---|---|
| Neue E-Mail | IMAP-Trigger auf INBOX, markiert verarbeitete Mails als gelesen |
| Mail aufbereiten | zieht Absender, Betreff und Text heraus und baut die Gemini-Anfrage |
| KI analysiert Mail | **Information Extractor** – zieht die Ticketfelder nach festem Schema heraus |
| Google Gemini Chat Model | das Sprachmodell dahinter (`gemini-3.5-flash-lite`), angedockt am Extractor |
| Ticket bauen | wertet die Antwort aus, wandelt das Datum um, verwirft Nicht-Anfragen |
| Ticket in Triage anlegen | schreibt das Ticket per REST in die Firebase-Datenbank |

### Benötigte Zugangsdaten (in n8n anzulegen, nicht in dieser Datei)

- **IMAP** – `imap.gmx.net:993`, SSL an
- **SMTP** – `mail.gmx.net:465`, SSL an
- **Google Gemini (PaLM) API** – Host `https://generativelanguage.googleapis.com`, dazu der API-Schlüssel

Die IDs der Zugangsdaten stehen im JSON, die Geheimnisse selbst liegen
ausschließlich verschlüsselt in n8n.

### Grenzen des kostenlosen Gemini-Tarifs

Das Kontingent zählt **pro Tag und Modell**, nicht pro Minute – Googles
Fehlermeldung ("retry in 41s") führt hier in die Irre. `gemini-3.5-flash` erlaubt
nur 20 Anfragen am Tag, deshalb läuft der Workflow auf `gemini-3.5-flash-lite`.
Wiederholversuche sind auf zwei begrenzt, weil jeder Versuch vom Tageskontingent
abgeht.

Zusätzlich filtert GMX offensichtlichen Spam bereits vor dem Postfach heraus
(Ordner "Spamverdacht"), sodass solche Mails gar kein Kontingent verbrauchen.
