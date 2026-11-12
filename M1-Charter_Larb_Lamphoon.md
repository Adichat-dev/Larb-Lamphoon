# M1 — Team Charter

**Project:** Community Waste Reporting and Collection Tracking System
**Team:** Larb Lamphoon

## Team members

| Student ID | Name |
| --- | --- |
| 6931503083 | Adichat Phontaweekordphon |
| 6931503075 | Siwakorn Chailak |
| 6931503068 | Rungniran Jaroenphan |
| 6931503087 | Akkaracha Thammakunta |

## Problem

Residents in communities may find it difficult to report overflowing bins or uncollected waste and to know whether the issue has been addressed. Reports may be scattered across calls, chats, or verbal requests, leaving residents and local staff without one shared status record. This can delay follow-up and make recurring waste hotspots harder to identify.

**Who exactly has it:** Residents who encounter overflowing bins or waste left at public collection points, and municipal/community waste-collection staff who receive and act on reports.

**Why it matters / current cost:** Residents spend time finding the right contact and repeatedly checking progress; staff may receive duplicate or incomplete reports and lack a clear history of unresolved or recurring locations.

## Gate 1 — Reachable users

| Person / role | How to reach | When |
| --- | --- | --- |
| 1. [Nont] — resident who has reported waste | Appointment & Personal IG | ☑ Yes ☐ No — 02/09/26 |
| 2. [Mix] — municipal waste-collection worker | Appointment & Personal IG | ☑ Yes ☐ No — 02/09/26 |
| 3. [Guitar] — community leader / municipal complaint officer | Appointment & Personal IG | ☑ Yes ☐ No — 03/09/26 |

> **Important:** These are planned interview targets, not completed interviews. Replace the name/date placeholders and update the charter after confirming access.

## Gate 2 — MVP shape

- **FR-1** Residents can submit a waste report with location, category, photo (optional), and description.
- **FR-2** The system generates a report ID and saves the report with its submission time.
- **FR-3** Staff can review assigned reports and update status: received, in progress, resolved, or rejected with a reason.
- **FR-4** Residents can look up their report status using the report ID.
- **FR-5** The system flags locations with repeated unresolved reports for staff review.

**Real rule / decision:** FR-5 flags a location when it has multiple unresolved reports within a defined time window; staff can prioritize these hotspots. The threshold and time window will be confirmed with interviewees.

**Persistent data:** user/report IDs, location, category, description, optional photo reference, timestamps, status history, staff assignment, resolution notes, and repeated-report counts.

## Gate 3 — Access

The MVP can use user-submitted test reports and manually entered status updates; no external API is required. The team must confirm permission to interview residents and local waste staff, and should avoid collecting unnecessary personal data. Map integration is optional for the first MVP; if used, the team will check the provider's licence and usage limits before implementation.

## Process & team

**Chosen SDLC:** Incremental. Build and test the core report-submission and status-tracking workflow first, validate it with interviewees, then add hotspot prioritization and optional map features.
