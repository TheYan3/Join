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
| Gemini analysiert | schickt die Mail an `gemini-3.5-flash` mit festem Antwort-Schema |
| Ticket bauen | wertet die Antwort aus, wandelt das Datum um, verwirft Nicht-Anfragen |
| Ticket in Triage anlegen | schreibt das Ticket per REST in die Firebase-Datenbank |

### Benötigte Zugangsdaten (in n8n anzulegen, nicht in dieser Datei)

- **IMAP** – `imap.gmx.net:993`, SSL an
- **SMTP** – `mail.gmx.net:465`, SSL an
- **Header Auth** – Name `x-goog-api-key`, Wert = Google-Gemini-Schlüssel

Die IDs der Zugangsdaten stehen im JSON, die Geheimnisse selbst liegen
ausschließlich verschlüsselt in n8n.

### Grenzen des kostenlosen Gemini-Tarifs

20 Anfragen pro Minute je Modell. Bei einer Anfrage pro Mail und maximal
10 Mails am Tag ist das unkritisch. Wird das Limit doch erreicht, schlägt der
Node fehl und der Fehlerpfad greift.
