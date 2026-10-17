# Nexia Bridge API

Express + MongoDB (Mongoose). Parents and clinicians sign in and share one child's record.

## Run it

```bash
npm install
npm run server          # http://localhost:4000
```

With no `MONGODB_URI`, development starts its own MongoDB 7 (data in `server/.data/db`).
On start it prints the **family invite codes** (one per child) and the **staff invite code**.

Production: set `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET` (32+ random chars),
`STAFF_INVITE_CODE`, `ADMIN_INVITE_CODE` (administrators only; the staff code cannot create admins), and `CORS_ORIGIN`. Put it behind HTTPS.

## Accounts

* Staff (therapist, teacher, supervisor...) register with the **staff invite code**.
* Parents register with their **child's invite code** (staff can see the codes in the app:
  BIP tab → Parent chat). A parent can only ever see that child.

## What each role can do

| Data | Staff | Parent |
|---|---|---|
| ABC events | read / write | no access |
| BIP | read / write | read, only when not a draft |
| Reinforcers, targets, saved sessions | read / write | read |
| Home tasks | read / write | read; may only set `done`, `doneAt`, `parentNote` |
| Messages | read / write (create-only) | read family messages, write |

Messages marked `audience: "staff"` (colleague-only) are never sent to parents.

## API

`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/me`, `POST /api/me/children`,
`GET /api/sync?since=<seq>`, `PUT|DELETE /api/records/:col/:id`, `GET /api/health`.

## Tests

```bash
npm run test:server
```

## Administration

Administrators (own `ADMIN_INVITE_CODE`) manage accounts, centres, cases and billing through `/api/admin/*`:
users (create, edit, role, centre, visibility scope, switch off), centres (special education, speech therapy, clinic),
children (create, reassign the team, transfer between centres, archive), invoices (draft → issued → paid / void),
the audit trail and the access table. An administrator with no centre covers the whole organisation; one with a
centre sees and changes that centre only. Staff only reach children of their own centre; archived cases are read-only.

## Supervision

Supervisors review goals and sessions, observe staff and publish reports. Their records are
ordinary synced collections with these rules (see `policy.js`):

| Collection | Who reads | Who writes | Notes |
|---|---|---|---|
| `observations`, `caseNotes` | clinical team | clinical team | Never sent to families or administrators |
| `teamRequests` | clinical team and administrators | clinical team; administrators may only change `status`, `adminNote` | A supervisor asks, the administrator answers |
| `templates`, `reports` | clinical team | clinical team | Organisation-wide: `childId` is always `"org"` |

Limits that the administrator sets in Settings (`integrityMin`, `ioaMin`, `observationDays`, `stalledDays`) are part of the
organisation settings and are sent to every signed-in person with `GET /api/me`.
