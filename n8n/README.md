# n8n-Workflows

Exportierte Workflows des Join Issue Collectors. Sie laufen auf der n8n-Instanz
des Homeservers und werden über die n8n Public API eingespielt.

## Importieren und aktivieren

Beim Einspielen von Hand gibt es zwei Stolpersteine:

1. **In den bestehenden Workflow hinein importieren, nicht daneben.** Diese
   Dateien enthalten bewusst keine Workflow-ID. Wer sie über „Import from File"
   aus der Workflow-Übersicht einspielt, bekommt deshalb einen **zweiten**
   Workflow gleichen Namens — dann laufen zwei Workflows auf dasselbe Postfach,
   oder der falsche ist aktiv. Richtig ist: den vorhandenen Workflow öffnen und
   erst **dort** im Drei-Punkte-Menü „Import from File" wählen. Das ersetzt den
   Inhalt, ID und Aktivierung bleiben erhalten.
2. **Danach den Active-Schalter prüfen.** Die Dateien enthalten kein
   `active`-Flag. Ein frisch angelegter Workflow ist deshalb **inaktiv** und
   verarbeitet nichts, bis er oben rechts eingeschaltet wird. Beide Workflows
   müssen aktiv sein, sonst funktioniert keine der Automatisierungen.

Die Zugangsdaten müssen nach dem Import nicht neu verbunden werden, solange die
Credential-IDs auf der Instanz dieselben sind — sie stehen im JSON.

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
| Ticket-Ergebnis anreichern | hängt das Schreibergebnis an die Ticketdaten der jeweiligen Mail |
| Ticket erfolgreich geschrieben? | trennt danach den Erfolgs- vom Fehlerweg |

Der Schreib-Baustein ist auf „bei Fehler normal weiterleiten" gestellt. Dadurch
kommt für **jede** eingehende Mail genau ein Ergebnis heraus, in unveränderter
Reihenfolge — gescheiterte eingeschlossen. Nur deshalb darf `Ticket-Ergebnis
anreichern` die Daten über die Position zuordnen. Diese eine Stelle ist der Kern
der Zuordnung: Wird der Baustein später verschoben oder der Fehlerweg wieder auf
einen eigenen Ausgang umgestellt, verrutscht die Zuordnung bei mehreren Mails in
einem Durchlauf, und Bestätigungen gingen an die falsche Adresse.

### Das Mailpasswort steht an zwei Stellen — beide müssen stimmen

Das ist die unangenehmste Falle des ganzen Aufbaus. Der Zugang zum Postfach wird
an **zwei voneinander unabhängigen Stellen** gebraucht:

| Stelle | Wofür | Wo |
|---|---|---|
| n8n-Credentials **IMAP** und **SMTP** | Mails abholen, Mails versenden | in der n8n-Oberfläche |
| Umgebungsvariable `JOIN_MAIL_PASSWORD` | Mails zwischen den Ordnern verschieben | `.env` im Docker-Stack |

Die Verschiebe-Bausteine (`Mail nach erledigt`, `Mail nach zu bearbeiten`,
`Mail erledigt (kein Ticket)`, `Mail erledigt (Limit)`) sprechen IMAP selbst über
`tls` an und lesen ihre Zugangsdaten aus `$env.JOIN_MAIL_HOST/PORT/USER/PASSWORD`
— **nicht** aus den n8n-Credentials.

**Folge beim Passwortwechsel:** Ändert man nur die n8n-Credentials, funktioniert
alles Sichtbare weiter — Mails kommen an, Tickets entstehen, Bestätigungen gehen
raus. Nur das Verschieben scheitert still mit `IMAP a1: NO authentication failed`,
und der Fehler steht ausschließlich im Lauf-Detail des jeweiligen Bausteins
(Feld `verschoben: false`), nicht als roter Fehler am Workflow. Der Lauf gilt
weiterhin als „success".

Nach dem Ändern von `.env` muss der Container **neu gestartet** werden
(`docker compose up -d` im Stack-Ordner) — Umgebungsvariablen werden nur beim
Start gelesen.

### Gescheiterte Mails bleiben liegen und kommen nicht wieder

Der IMAP-Trigger markiert jede Mail **sofort beim Abholen als gelesen**, bevor
irgendein weiterer Baustein läuft. Er holt aber nur **ungelesene** Mails.

Daraus folgt: Bricht die Verarbeitung später ab — oder scheitert wie oben nur das
Verschieben — bleibt die Mail als gelesen im Posteingang liegen und wird
**nie erneut verarbeitet**. Ein erneuter Lauf holt sie nicht nach.

Wer solche Mails nachträglich verarbeiten lassen will, muss sie im Postfach von
Hand wieder auf **ungelesen** setzen. Wer sie nur loswerden will, verschiebt oder
löscht sie von Hand. Vor einer Vorführung lohnt ein Blick in den Posteingang: Was
dort liegt, hat das System entweder nicht geschafft oder gar nicht erst gesehen.

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


## statusbenachrichtigung.json

Schaut alle 5 Minuten nach, ob ein Ticket die Spalte gewechselt hat, und
benachrichtigt den Ersteller per Mail.

| Node | Aufgabe |
|---|---|
| Alle 5 Minuten | Zeitplan-Auslöser |
| Tickets abrufen | holt den aktuellen Stand aller Tickets |
| Statusänderungen finden | vergleicht mit dem zuletzt gesehenen Stand |
| Benachrichtigung vorbereiten | baut den Mailtext, schützt vor Endlosschleifen |
| Benachrichtigung senden | verschickt über SMTP |

### Warum Abfragen statt sofortiger Meldung

Die n8n-Instanz ist bewusst nur im Heimnetz erreichbar. Das Board läuft aber im
Browser der Stakeholder irgendwo im Internet und könnte n8n deshalb gar nicht
direkt ansprechen. Statt einen Zugang von außen zu öffnen, fragt n8n selbst
regelmäßig nach. Preis dafür: bis zu 5 Minuten Verzögerung.

### Der gemerkte Stand

Der zuletzt gesehene Status jedes Tickets liegt im internen Speicher des
Workflows und überlebt einzelne Durchläufe. Zwei Eigenschaften sind wichtig:

- **Der allererste Lauf verschickt nichts.** Er merkt sich nur den Ausgangsstand.
  Sonst bekäme jeder Ersteller sofort eine Mail für ein Ticket, das sich nie
  bewegt hat.
- **Gelöschte Tickets werden aus dem Gedächtnis entfernt**, damit es nicht
  unbegrenzt wächst.

### Schutz vor Endlosschleifen

Alle Mail-versendenden Stellen prüfen, ob der Empfänger das eigene Postfach ist,
und brechen dann ab. Ohne das würde eine Antwort im eigenen Posteingang landen,
den Sammel-Workflow erneut auslösen und die nächste Mail erzeugen.

Zusätzlich werden Adressen auf `.local` übersprungen. Der Gast-Login des Boards
legt Tickets unter `guest@join.local` an — eine Domain, die es nicht gibt. Ohne
diese Prüfung erzeugt jedes Verschieben eines Gast-Tickets einen SMTP-Fehler im
n8n-Protokoll.
