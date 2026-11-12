# Software Requirements Specification

**Community Residual Waste Management System**

Introduction to Software Engineering (15031001) · Week 3 · Requirements & Specification

Team Larb Lamphon · v1.2 · 9 Nov 2026

| Field | Details |
| --- | --- |
| Team name | Larb Lamphon |
| Project title | Community Residual Waste Management System — Citizen Reporting and Collection Tracking |
| SDLC chosen in M1 + reason | Incremental - Once feedback is received, it can be used for ongoing tracking and improvement. |
| Date / version | 9 Nov 2026 · v1.2 |
| GitHub repo | https://github.com/Adichat-dev/Larb-Lamphoon.git |

## Revision history

| Version | Date | Changes |
| --- | --- | --- |
| v1.0 | 9 Oct 2026 | Initial specification (browser-only prototype, no accounts). |
| v1.1 | 7 Nov 2026 | Added accounts and role-based access (FR-6, UC-6); data now stored in a server-side database; removed "user accounts and login" from out of scope; added NFR-6 and NFR-7; updated FR-1 to FR-4, NFR-1, NFR-3, the use-case diagram, the traceability matrix and the AI usage log. Changes are marked [v1.1]. |
| v1.2 | 9 Nov 2026 | Added an optional, administrator-only AI trend summary (FR-7, UC-7) with strict data-minimisation and access rules (NFR-8, NFR-9, NFR-10); added section 2.3 (security impact of the AI addition); updated 1.1, 1.2, 2.1, 2.2, FR-5 note, NFR-1, the use-case list and diagram, out of scope, the traceability matrix and the AI usage log. All v1.1 security requirements are unchanged. Changes are marked [v1.2]. |

## 1. Introduction

### 1.1 Purpose and scope

Residents who find overflowing bins or illegally dumped waste in their community have no clear way to tell the municipality, and no way to know whether anyone has acted on the problem. Collection staff, in turn, receive complaints in scattered channels with no consistent priority or status. The Community Residual Waste Management System is a web application that lets citizens report a waste spot with a type, urgency, location and photo, receive a tracking number, and follow the report until the waste is collected. Collection officers see a queue sorted by urgency and update each job's status, and municipality administrators see summary figures, areas with repeated problems, and a CSV report. The MVP covers reporting, tracking, status updates, status-change notification, and summary reporting. Success looks like a citizen can see the current status of any report from its tracking number, and an administrator can see which areas have repeated problems without compiling them by hand.

[v1.1] The system uses accounts for three roles (citizen, collection officer, municipality administrator) and stores all data in a server-side database.

[v1.2] The system also offers one optional AI feature: an administrator can ask an AI service to write a short text summary of report trends. The feature is read-only and advisory, is available to administrators only, and sends the AI service only the minimal data listed in NFR-8. The system works fully without it.

### 1.2 Users and stakeholders

| Name / role | Kind | What they need | What they fear / forbid |
| --- | --- | --- | --- |
| Citizen (primary user) | primary user | Report a waste spot with photo and location, get a tracking number, and see progress. [v1.1] Register and log in to submit reports. | Reports being ignored or lost, with no way to know the status. [v1.2] Personal data being passed on to outside services. |
| Collection officer (primary user) | primary user | See pending jobs ordered by urgency, accept a job, and mark it collected with an optional after-photo | Unclear priorities, missing location details, and duplicate or stale jobs |
| Municipality administrator | secondary stakeholder | View totals by status, find areas with repeated reports, and export a report. [v1.2] Get a plain-language summary of trends. | Recurring problem areas going unnoticed; having no evidence for planning or reporting. [v1.2] An AI summary that is wrong, or that exposes citizen data. |

## 2. Overall description

### 2.1 Product context — what it does / does not

**IN SCOPE (MVP this term)**

- FR-1 Report waste spot with photo / location

- FR-2 Receive tracking number and track status

- FR-3 Officer views queue and updates status

- FR-4 Notify on status change (in-app)

- FR-5 Summary dashboard and CSV report

- [v1.1] FR-6 Register and log in by role

- [v1.2] FR-7 Administrator-only AI trend summary (optional, read-only, advisory)

**OUT OF SCOPE (explicit promise)**

- Real SMS / LINE / e-mail push notifications

- [v1.1] Sign-in with Google or other third-party providers

- [v1.1] E-mail verification and password reset

- [v1.2] AI analysis of photos or of free-text descriptions

- [v1.2] AI that changes data or makes decisions (assigning jobs, changing status, editing accounts)

- [v1.2] AI features for citizens or officers

- Truck routing or collection scheduling

- Waste treatment, recycling or disposal processing

### 2.2 Assumptions and constraints

- Assumption: The system is tested with simulated data during this term; real reports will be entered by citizens using a smartphone or computer browser with an internet connection.

- [v1.1] Constraint: All data is stored in a server-side SQLite database, so every device sees the same data; the server must be running for the system to be used.

- [v1.1] Constraint: Self-registration creates citizen accounts only. Officer and administrator accounts are created by the development team from the command line.

- Constraint: Notifications are in-app messages stored in the database and shown on screen; they are not sent to citizens' phones.

- Constraint: The user interface is in Thai; this SRS is written in English.

- [v1.2] Constraint: The AI summary calls an external AI service (the Anthropic Claude API). It needs internet access and an API key held by the team on the server, is billed by the provider, and is optional: without a key every other function works unchanged. The model is set by the server setting ANTHROPIC_MODEL (default claude-sonnet-5-5); changing it does not change what data is sent.

- [v1.2] Constraint: AI output is advisory. The administrator must check it against the dashboard figures before using it in a report.

### 2.3 Security impact of the AI addition [v1.2]

Adding the AI feature must not weaken the protection of existing data. The table shows what the AI service can and cannot receive.

| Sent to the AI service (only when an administrator presses the button) | Never sent to the AI service |
| --- | --- |
| Area text, waste type, urgency, status and report time, for at most the 300 most recent reports | Description text, photos and after-photos, citizen names, e-mail addresses, passwords or hashes, user IDs, tracking numbers, notifications, staff data |

Existing controls are unchanged and still apply: accounts and role-based access (FR-6), bcrypt password hashes (NFR-6), login attempt limit (NFR-7), and tracking only by exact number with no listing of other citizens' reports (NFR-4).

Known residual risk: the area text is typed by citizens and could contain personal information by mistake. The report form should advise citizens not to enter personal information, and administrators should treat the area text as sensitive.

## 3. Functional requirements

Format: As a <role>, I want <goal>, so that <benefit>. Every story traces to a pain, and every acceptance criterion is testable.

### FR-1 — Report waste spot with photo and location

**User story:** As a citizen, I want to report a waste spot by choosing a waste type and urgency, describing the problem, and giving a location and an optional photo, so that the municipality knows exactly where and what the problem is.

**Pain this traces to:** residents have no single, structured way to report waste, and reports lack a clear location and evidence.

**Acceptance criteria:**

- [v1.1] Given the citizen is logged in and the description and location are filled in, when the citizen submits the report, then the system creates a report with the chosen type and urgency and the status "Pending".

- Given the description or location is empty, when the citizen submits, then the system rejects the report and asks for the missing information.

- Given the citizen attaches an image, when the report is submitted, then the photo is saved with the report.

### FR-2 — Receive tracking number and track status

**User story:** As a citizen, I want to receive a tracking number and look up my report with it, so that I can see its current status and history without contacting anyone.

**Pain this traces to:** citizens do not know whether a report was received or acted on.

**Acceptance criteria:**

- Given a report is submitted, when it is saved, then the system shows a unique tracking number in the format WS-0001.

- [v1.1] Given a valid tracking number, when anyone searches (logged in or not), then the system shows the current status, urgency, type, location, description, photos and a dated status history.

- Given an unknown tracking number, when the citizen searches, then the system shows a "not found" message.

### FR-3 — Officer views queue and updates status

**User story:** As a collection officer, I want to see open jobs ordered by urgency and update each job's status, so that I handle the most urgent waste first and everyone can see progress.

**Pain this traces to:** officers receive complaints without priority or status, so urgent problems wait behind routine ones.

**Acceptance criteria:**

- Given open reports exist, when the officer opens the job list, then reports with status Pending or In progress are listed with the most urgent first and, within the same urgency, the oldest first.

- Given a Pending job, when the officer accepts it, then its status becomes "In progress" and the change is added to the history with a time stamp.

- Given an In progress job, when the officer marks it collected (optionally attaching an after-photo), then its status becomes "Collected" and the job leaves the open list.

- [v1.1] Given a job, when the officer requests a status change out of the order Pending, In progress, Collected (for example Pending directly to Collected), then the system rejects the change.

### FR-4 — Notify on status change

**User story:** As a citizen, I want to be notified when my report's status changes, so that I know when action has been taken.

**Pain this traces to:** citizens must keep checking back to find out whether anything has happened.

**Acceptance criteria:**

- [v1.1] Given an officer changes a report's status, when the change is saved, then the system stores a notification naming the tracking number and the new status for the report's owner and shows it when that citizen is logged in.

- Given a status change, when the citizen later looks up the tracking number, then the new status and time appear in the history.

### FR-5 — Summary dashboard and CSV report

**User story:** As a municipality administrator, I want to see totals by status, areas with repeated reports, and export the reports as a CSV file, so that I can plan work and report results.

**Pain this traces to:** recurring problem areas are not noticed because reports are not summarised anywhere.

**Acceptance criteria:**

- Given reports exist, when the administrator opens the dashboard, then it shows the total number of reports and the number in each status.

- Given the same location was reported more than once, when the administrator opens the dashboard, then that location is listed with its number of reports.

- Given reports exist, when the administrator exports, then a CSV file is downloaded with tracking number, area, waste type, urgency, description, status and report time for every report.

### FR-6 — Register and log in by role [v1.1]

**User story:** As a user, I want to register and log in, so that each role can use only the functions it is allowed to.

**Pain this traces to:** reports and administrative data can be accessed or changed by people who should not see them.

**Acceptance criteria:**

- Given an unused e-mail and a password of at least 8 characters containing letters and a number, when the user registers, then the system creates a citizen account and logs the user in.

- Given a wrong e-mail or password, when the user logs in, then the system shows a generic error that does not reveal which field was wrong.

- Given a logged-in citizen, when the citizen opens an officer or administrator function, then the system refuses the request.

- Given a logged-in user, when the user logs out, then the session ends and protected pages are no longer accessible.

### FR-7 — Administrator-only AI trend summary [v1.2]

**User story:** As a municipality administrator, I want to press one button and get a short written summary of report trends, so that I can see where to focus without reading every table row.

**Pain this traces to:** the same pain as FR-5 — recurring problem areas are not noticed because reports are not summarised. The dashboard gives counts but no written overview of areas, backlog and urgency. (Team to validate with the administrator interviewee.)

**Acceptance criteria:**

- Given the administrator is logged in, reports exist and the AI service is configured, when the administrator presses "Summarise with AI" on the dashboard, then the system shows a Thai text summary with an overview, repeated areas, backlog and urgency, and 2–3 suggestions.

- Given no reports exist, when the button is pressed, then the system shows a "no reports" message and sends nothing to the AI service.

- Given a user who is not logged in, a citizen or an officer, when that user requests the summary, then the system refuses the request.

- Given the AI service is not configured or cannot be reached, when the button is pressed, then the system shows an error message and every other dashboard function keeps working.

- Given a summary is requested, when the system calls the AI service, then only the data listed in NFR-8 is sent, and the AI cannot create or change any report, status or account.

- Given a summary is shown, then it is displayed as plain text and labelled as advisory.

## 4. Non-functional requirements

Statements are measurable; at least one covers security / privacy.

| ID | Kind | Statement (testable) | How we will check |
| --- | --- | --- | --- |
| NFR-1 | performance | Every user action (submit report, search, change status, log in, export CSV) shall complete and update the screen within 10 seconds. [v1.1] The AI summary is excluded and is covered by NFR-10. [v1.2] | Browser developer-tools network timing, 3 trials per action [v1.1] |
| NFR-2 | usability | A first-time citizen shall submit a complete report in under 90 seconds without help from a teammate. | Timed user test with 3 people |
| NFR-3 | reliability | Submitted reports, accounts and status history shall still be present after the server is restarted and when opened from another device. [v1.1] | Restart the server; open the system from a second device [v1.1] |
| NFR-4 | security / privacy | The citizen view shall show a report only when its exact tracking number is entered, and shall not list other citizens' reports or personal data. | Search with a wrong number; inspect the citizen view |
| NFR-5 | compatibility | All screens shall be usable without horizontal scrolling on a 360-pixel-wide phone screen and on a desktop browser. | Resize browser to 360 px; test on one phone |
| NFR-6 | security [v1.1] | Passwords shall be stored only as salted hashes (bcrypt) and never as plain text. | Inspect the users table in the database |
| NFR-7 | security [v1.1] | After 10 failed login attempts within 15 minutes, the system shall temporarily block further attempts. | Enter a wrong password repeatedly and observe the block message |
| NFR-8 | privacy [v1.2] | A request to the AI service shall contain only area text, waste type, urgency, status and report time for at most the 300 most recent reports. It shall never contain descriptions, photos, names, e-mail addresses, passwords or hashes, user IDs or tracking numbers. | Review the database query in the code; log the outgoing request body in a test and inspect it |
| NFR-9 | security [v1.2] | The AI summary function shall be available only to a logged-in administrator. The AI provider's API key shall be held only in a server environment variable and shall never appear in the source code, the Git repository or any response sent to the browser. | Call the function as a citizen, an officer and logged out; search the repository and the browser network responses for the key; confirm that .env is listed in .gitignore |
| NFR-10 | reliability / cost [v1.2] | The AI summary shall return a result or an error message within 30 seconds and shall be limited to 5 requests per 10 minutes. A failure or a missing API key shall not affect any other function. | Press the button 6 times within 10 minutes; start the server without a key and use every other function |

## 5. Use cases

### 5.1 Use-case list

| Use case | Actor | Related FR | Brief success story |
| --- | --- | --- | --- |
| UC-1 | Citizen | FR-1 | Citizen fills in type, urgency, description, location and photo and submits a waste report. |
| UC-2 | Citizen | FR-2 | Citizen enters a tracking number and sees the report's status and history. |
| UC-3 | Collection officer | FR-3 | Officer accepts a job and later marks it collected with an after-photo. |
| UC-4 | Citizen / Collection officer | FR-4 | A status change is saved and a notification showing the new status appears. |
| UC-5 | Municipality administrator | FR-5 | Administrator reviews totals and repeated areas and exports a CSV report. |
| UC-6 [v1.1] | All users | FR-6 | A user registers or logs in and is taken to the page for their role. |
| UC-7 [v1.2] | Municipality administrator | FR-7 | Administrator presses the AI summary button and reads a short written summary of trends, which is checked against the dashboard figures. |

### 5.2 Use-case diagram

System boundary: Community Waste Management System. Actors and the use cases each one takes part in:

![Use-case diagram](images/use-case-diagram.png)

*use-case diagram · 3 actors, 7 use cases, 1 external system*

External system [v1.2]: the AI service is called only by UC-7.

## 6. Out of scope

- Real SMS, LINE or e-mail push notifications (notifications are shown in-app only).

- [v1.1] Sign-in with Google or other third-party providers, e-mail verification and password reset. (Basic accounts and role-based access are now in scope as FR-6.)

- [v1.2] AI analysis of photos or free-text descriptions; AI that changes data or makes decisions; AI features for citizens or officers; sending personal data to any outside service. (Only the read-only administrator summary in FR-7 is in scope.)

- Truck routing, shift planning or collection scheduling.

- Waste treatment, recycling programmes or disposal processing.

- Fines or enforcement against people who dump waste.

## 7. Traceability matrix (Golden Thread)

| Problem / pain | Requirement (FR) | Solution / design | Feature built | Test |
| --- | --- | --- | --- | --- |
| Reports lack a structured form, location and evidence | FR-1 report with photo / location | Report form with type, urgency, location, photo | Report form and GPS button | Submit-report test |
| Citizens cannot tell if a report was received or acted on | FR-2 tracking number | Ticket ID and history timeline | Tracking search (WS-0001) | Tracking lookup test |
| Urgent waste waits behind routine complaints | FR-3 officer queue and status | Urgency-sorted job list with status buttons | Officer job list, after-photo | Queue order and status test |
| Citizens must keep checking for progress | FR-4 status notification | Notification on status change | In-app notification | Notification test |
| Repeated problem areas go unnoticed | FR-5 dashboard and CSV | Counts by status, repeated-area list, CSV export | Admin dashboard and export | Dashboard and CSV test |
| Data accessible to unauthorised people [v1.1] | FR-6 register and log in by role | Account system with role-based access | Sign-up / log-in pages, role-restricted pages | Cross-role access test |
| Trends are not summarised in words; the administrator reads tables by hand [v1.2] | FR-7 AI trend summary (NFR-8, NFR-9, NFR-10) | Admin-only server function that sends minimal data to an AI service and shows plain text | "Summarise with AI" button on the admin dashboard | AI summary test; data-minimisation test (NFR-8); cross-role and key-exposure test (NFR-9); limit and no-key test (NFR-10) |

## 8. AI usage log

Log every prompt that drafted a story or paragraph, honestly. [v1.2] Note: this log records AI used to write the project. The AI feature inside the product (FR-7) is specified above and is separate from this log.

| Date | Tool / model | What we asked | What AI produced | What we changed / verified | What we learned |
| --- | --- | --- | --- | --- | --- |
| 22 Oct 2026 | Claude | Write an English SRS in the format of the Word template, using the uploaded HTML prototype for the content. | Drafted all sections: scope, stakeholders, FRs, NFRs, use cases, diagram, traceability and out-of-scope content. | Team must check team name, SDLC, repo, NFR numbers and the pain statements against real users and the prototype. | Each FR should be traced to the prototype's features and to a pain that is verified with real residents. |
| 7 Nov 2026 [v1.1] | Claude | Build a secure web app with login and a database from the SRS and the Figma screenshots; draft the SRS v1.1 changes. | Express/SQLite backend, Thai web front end, README, and the v1.1 text for FR-6, NFR-6, NFR-7, UC-6 and related edits. | [Team to complete: what we tested, fixed or reviewed] | [Team to complete] |
| 9 Nov 2026 [v1.2] | Claude | Add an administrator-only AI trend summary to the existing app, and update the SRS to v1.2 with the new feature while keeping existing data secure. | Server function and dashboard button for the AI summary, setup notes, and the v1.2 text for FR-7, NFR-8 to NFR-10, UC-7, section 2.3 and related edits. | [Team to complete: what we tested, e.g. the NFR-8 payload check, the NFR-9 access and key checks, the NFR-10 limit and no-key checks] | [Team to complete] |

## 9. Self-check

- [ ] Every FR is a user story with a benefit

- [ ] Every FR has testable acceptance criteria

- [ ] No FR is vague (no bare "fast", "easy", "user-friendly")

- [ ] NFRs exist, including security / privacy

- [ ] Every FR traces back to a stated problem

- [ ] Scope and out-of-scope are stated

- [ ] Use-case list matches the FR list

- [ ] AI log is honest