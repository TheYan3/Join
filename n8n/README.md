# n8n Workflows

Exported workflows for the Join issue collector. They run on the home server's
n8n instance and are imported via the n8n Public API.

## Importing and activating

Importing by hand has two pitfalls:

1. **Import into the existing workflow, not next to it.** These files
   deliberately contain no workflow ID. Importing them via "Import from File"
   from the workflow overview therefore creates a **second** workflow with the
   same name — then two workflows run against the same mailbox, or the wrong
   one is active. The right way: open the existing workflow and choose
   "Import from File" from **its own** three-dot menu. That replaces the
   content while keeping the ID and activation state.
2. **Check the active toggle afterwards.** The files contain no `active`
   flag. A freshly created workflow is therefore **inactive** and processes
   nothing until it is switched on in the top right. Both workflows must be
   active, otherwise none of the automations work.

Credentials don't need to be reconnected after import, as long as the
credential IDs on the instance are the same — they're stored in the JSON.

## issue-collector.json

Fetches mails from the mailbox `join-issues@gmx.de`, has them analysed by
Google Gemini, and creates a ticket from them in the Triage column of the
Join board.

| Node | Purpose |
|---|---|
| Neue E-Mail | IMAP trigger on INBOX, marks processed mails as read |
| Mail aufbereiten | extracts sender, subject and body and builds the Gemini request |
| KI analysiert Mail | **Information Extractor** – pulls the ticket fields using a fixed schema |
| Google Gemini Chat Model | the language model behind it (`gemini-3.5-flash-lite`), attached to the extractor |
| Ticket bauen | evaluates the response, converts the date, discards non-requests |
| Ticket in Triage anlegen | writes the ticket into the Firebase database via REST |
| Ticket-Ergebnis anreichern | attaches the write result to each mail's ticket data |
| Ticket erfolgreich geschrieben? | splits the success path from the error path afterwards |

The write node is set to "continue on fail". Because of that, **every**
incoming mail produces exactly one result, in unchanged order — failures
included. That's the only reason `Ticket-Ergebnis anreichern` is allowed to
match data by position. This one spot is the crux of the matching: if the
node is later moved, or the error path is switched back to its own output,
the matching shifts once several mails go through in one run, and
confirmations would go to the wrong address.

### The mail password lives in two places — both must match

This is the nastiest trap in the whole setup. Access to the mailbox is
needed in **two independent places**:

| Place | What for | Where |
|---|---|---|
| n8n credentials **IMAP** and **SMTP** | fetching mails, sending mails | in the n8n UI |
| Environment variable `JOIN_MAIL_PASSWORD` | moving mails between folders | `.env` in the Docker stack |

The move nodes (`Mail nach erledigt`, `Mail nach zu bearbeiten`,
`Mail erledigt (kein Ticket)`, `Mail erledigt (Limit)`) talk to IMAP
themselves via `tls` and read their credentials from
`$env.JOIN_MAIL_HOST/PORT/USER/PASSWORD` — **not** from the n8n credentials.

**Consequence when the password changes:** if only the n8n credentials are
updated, everything visible keeps working — mails arrive, tickets get
created, confirmations go out. Only the moving fails silently with
`IMAP a1: NO authentication failed`, and the error only shows up in that
node's run detail (field `verschoben: false`), not as a red error on the
workflow. The run still counts as "success".

After changing `.env` the container must be **restarted**
(`docker compose up -d` in the stack folder) — environment variables are
only read at startup.

### Failed mails stay put and are never retried

The IMAP trigger marks every mail **as read immediately on fetch**, before
any further node runs. But it only fetches **unread** mails.

As a result: if processing later aborts — or only the move step fails as
above — the mail stays in the inbox marked as read and is **never processed
again**. A later run won't pick it up.

To have such mails processed after the fact, mark them **unread** again by
hand in the mailbox. To just get rid of them, move or delete them by hand.
Before a demo it's worth checking the inbox: whatever is sitting there, the
system either failed to handle it or never saw it at all.

### Required credentials (set up in n8n, not in this file)

- **IMAP** – `imap.gmx.net:993`, SSL on
- **SMTP** – `mail.gmx.net:465`, SSL on
- **Google Gemini (PaLM) API** – host `https://generativelanguage.googleapis.com`, plus the API key

The credential IDs are in the JSON, the secrets themselves live only
encrypted inside n8n.

### Limits of the free Gemini tier

The quota counts **per day and model**, not per minute — Google's error
message ("retry in 41s") is misleading here. `gemini-3.5-flash` only allows
20 requests per day, which is why the workflow runs on
`gemini-3.5-flash-lite`. Retries are capped at two, because every attempt
counts against the daily quota.

Additionally, GMX already filters obvious spam before it reaches the
mailbox (folder "Spamverdacht"), so such mails don't consume any quota.


## statusbenachrichtigung.json

Checks every 5 minutes whether a ticket has changed column, and notifies its
creator by e-mail.

| Node | Purpose |
|---|---|
| Alle 5 Minuten | schedule trigger |
| Tickets abrufen | fetches the current state of all tickets |
| Statusänderungen finden | compares against the last-seen state |
| Benachrichtigung vorbereiten | builds the mail text, guards against infinite loops |
| Benachrichtigung senden | sends via SMTP |

### Why polling instead of an instant notification

The n8n instance is deliberately reachable only from the home network. But
the board runs in the stakeholders' browser somewhere on the internet and
couldn't reach n8n directly at all. Instead of opening access from outside,
n8n itself polls regularly. The price for that: up to 5 minutes of delay.

### The remembered state

The last-seen status of every ticket lives in the workflow's internal
storage and survives individual runs. Two properties matter:

- **The very first run sends nothing.** It only records the starting state.
  Otherwise every creator would immediately get a mail for a ticket that
  never actually moved.
- **Deleted tickets are removed from memory**, so it doesn't grow without
  bound.

### Protection against infinite loops

Every mail-sending node checks whether the recipient is the collector's own
mailbox and aborts if so. Without that, a reply would land in the collector's
own inbox, re-trigger the workflow, and generate the next mail.

Addresses ending in `.local` are also skipped. The board's guest login
creates tickets under `guest@join.local` — a domain that doesn't exist.
Without this check, moving a guest ticket would produce an SMTP error in the
n8n log every time.
