# Community Waste Management System --- Mobile Version

## 1. Project Overview

The Community Waste Management System is a mobile-friendly web prototype
that helps community members report uncollected waste, track complaint
progress, and coordinate waste collection activities with staff and
municipal administrators.

The interface is designed to work on mobile phones, tablets, and desktop
computers.

> **Prototype notice:** This version stores information in the current
> browser on the current device. It is a demonstration only and is not
> connected to a real municipal backend or database.

## 2. User Roles and Features

### Citizens

-   Submit a report about uncollected waste.
-   Enter a description and the affected location.
-   Use the device's GPS to fill in coordinates, when permission is
    granted.
-   Attach an image as supporting evidence.
-   Receive a tracking number for each report.
-   Check the status of a submitted report using its tracking number.

### Collection Staff

-   View reports that are waiting for action or are in progress.
-   Accept a report and change its status to **In Progress**.
-   Mark the collection task as completed.

### Municipal Administrators

-   View summary counts for all reports, reports awaiting action,
    reports in progress, and completed reports.
-   Identify locations where reports have been submitted repeatedly.
-   Export report data as a CSV file.
-   Clear the demonstration data stored in the current browser.

## 3. Mobile-Friendly Design

The mobile interface includes: - A responsive layout that adapts to
different screen sizes. - Large buttons and form fields suitable for
touch input. - Navigation tabs for Citizens, Collection Staff, and
Municipal Administrators. - A layout that places the main content above
the workflow summary on smaller screens. - Image previews before a
report is submitted.

## 4. Technologies Used

-   **HTML5** --- page structure and form controls.
-   **CSS3** --- responsive layout and visual styling.
-   **JavaScript** --- report submission, tracking, status updates,
    summaries, and CSV export.
-   **Local Storage** --- saves demonstration reports in the browser.
-   **Geolocation API** --- retrieves device coordinates after the user
    grants permission.
-   **FileReader API** --- displays selected images in the interface.
-   **Blob and URL APIs** --- generate the CSV download.

## 5. How to Run

1.  Save the application source code as `index.html`.
2.  Open `index.html` in a modern web browser.
3.  On a mobile device, open the page in the device's browser to test
    the responsive interface.

For GPS functionality, the browser may require a secure context (HTTPS
or localhost) and the user's permission. If GPS is unavailable, enter
the location manually.

## 6. Data Storage and Limitations

-   Report data is saved in the browser's Local Storage on the current
    device.
-   Data is not automatically shared between different devices or
    browsers.
-   Clearing browser data may remove saved reports.
-   The prototype does not include user authentication, a central
    database, a live municipal connection, push notifications, or a
    production deployment.
-   Image attachments are stored locally as browser data, so large
    images may use substantial storage space. The application limits
    each selected image to 5 MB.

## 7. Suggested Future Improvements

-   Build a backend API and central database.
-   Add secure authentication and role-based access control.
-   Connect reports to a real municipal workflow.
-   Display submitted locations on an interactive map.
-   Send notifications when report statuses change.
-   Add data validation, audit logs, and backup/restore features.
-   Deploy the application over HTTPS for reliable mobile access.

## 8. Privacy and Responsible Use

Ask users for location and image permissions only when needed. Avoid
including personal or sensitive information in report descriptions or
photographs. Before using this prototype with real community data,
implement appropriate security, privacy, access-control, and
data-retention measures.

## 9. License

No license has been specified for this prototype. Add a license file if
you plan to distribute or reuse the project publicly.
