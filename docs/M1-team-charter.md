# M1 — Team Charter

**Project:** Community Residual Waste Management System — Citizen Reporting and Collection Tracking
**Team:** Larb Lamphoon

## Team members

| Student ID | Name |
| --- | --- |
| 6931503083 | Adichat Phontaweekordphon |
| 6931503075 | Siwakorn Chailak |
| 6931503068 | Rungniran Jaroenphan |
| 6931503087 | Akkaracha Thammakunta |

## Problem

Residents who find overflowing bins or illegally dumped waste in their community have no clear way to tell the municipality, and no way to know whether anyone has acted on the problem. Collection staff, in turn, receive complaints through scattered channels (calls, chats, verbal requests) with no consistent priority or status. This delays follow-up and makes recurring problem areas hard to identify.

**Who exactly has it:** Residents (citizens) who encounter overflowing bins or waste left at public collection points; collection officers who receive and act on reports; and municipality administrators who need to see which areas have repeated problems.

**Why it matters / current cost:** Residents spend time finding the right contact and repeatedly checking progress; officers receive complaints without priority or status, so urgent waste waits behind routine reports; administrators have no summary or evidence for planning and must compile figures by hand.

## Gate 1 — Reachable users

| Person / role | How to reach | When |
| --- | --- | --- |
| 1. [Nont] — resident (citizen) who has reported waste | Appointment & Personal IG | ☑ Yes ☐ No — 02/09/26 |
| 2. [Mix] — municipal waste-collection worker (collection officer) | Appointment & Personal IG | ☑ Yes ☐ No — 02/09/26 |
| 3. [Guitar] — community leader / municipal complaint officer (administrator perspective) | Appointment & Personal IG | ☑ Yes ☐ No — 03/09/26 |

> **Important:** These are planned interview targets, not completed interviews. Replace the name/date placeholders and update the charter after confirming access.

## Gate 2 — MVP shape

Three roles use the system: citizen, collection officer and municipality administrator. Requirement numbers match the SRS (v1.2).

- **FR-1** Citizens can report a waste spot with waste type, urgency, description, location and an optional photo.
- **FR-2** The system gives each report a unique tracking number (format WS-0001); anyone can look up the current status and dated history using that number.
- **FR-3** Collection officers see open jobs (Pending / In progress) ordered by urgency, then oldest first; they accept a job (In progress) and mark it collected (Collected) with an optional after-photo. Status changes must follow the order Pending → In progress → Collected.
- **FR-4** The system stores an in-app notification for the report's owner whenever the status changes.
- **FR-5** Municipality administrators see totals by status, locations with repeated reports, and can export a CSV report.
- **FR-6** Users register (citizens only) and log in; each role can use only the functions it is allowed to.
- **FR-7** *(optional)* An administrator can request a short, advisory AI text summary of report trends. It is read-only and sends only minimal data (area, waste type, urgency, status, report time).

**Real rule / decision:** FR-3 sorts and controls the job queue by urgency and a fixed status order. FR-5 lists a location as a repeated-problem area when it has been reported more than once, so administrators can prioritise it. Whether a time window or a higher threshold is needed will be confirmed with interviewees.

**Persistent data:** user accounts and roles (passwords stored only as bcrypt hashes), reports with tracking number, area/location, waste type, urgency, description, photo and after-photo references, timestamps, status history, and in-app notifications.

## Gate 3 — Access

The MVP uses simulated, user-submitted test reports and runs on a server-side SQLite database. Citizen accounts are created by self-registration; officer and administrator accounts are created by the team. The team must confirm permission to interview residents and local waste staff, and should avoid collecting unnecessary personal data. The citizen view shows a report only when its exact tracking number is entered.

The only external service is the optional AI summary (FR-7), which uses the Anthropic Claude API. It needs internet access and an API key held by the team in a server environment variable (never in the repository), is billed by the provider, and is not required: without a key every other function works unchanged. No map provider is used; location is entered as text, with a GPS button for convenience. Real SMS, LINE or e-mail notifications are out of scope.

## Process & team

**Chosen SDLC:** Incremental. Build and test the core report-submission and tracking workflow first (FR-1 to FR-4), validate it with interviewees, then add the administrator dashboard, accounts and role-based access, and finally the optional AI trend summary. Each increment is recorded as a version in the SRS (v1.0 → v1.2).
