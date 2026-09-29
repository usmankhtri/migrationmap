# Security Policy

## Reporting Security Vulnerabilities

MigrationMap is an open-source, client-side application. We take vulnerabilities and data safety seriously.

If you believe you have discovered a security issue, vulnerability, or potential exploit in MigrationMap, please report it responsibly:

- **Email:** Report findings privately via email to promptility.ai@gmail.com
- **Response Time:** We will acknowledge receipt of reports within 48 hours and provide a remediation timeline.
- **Public Disclosure:** Please do not open public GitHub issues for sensitive security vulnerabilities until we have reviewed and released a patch.

## Scope & Design Assumptions

- **Client-Side Execution:** MigrationMap runs entirely within the user's browser. URL datasets and redirect mappings are processed and stored locally in browser storage (IndexedDB). They are never transmitted to backend servers or third-party APIs.
- **Spreadsheet Formula Injection Defense:** All CSV exports apply cell sanitization to prevent unintended formula execution (`=`, `+`, `-`, `@`, `\t`, `\r`) in desktop spreadsheet applications.
- **Sanitized Markup:** The application does not use `dangerouslySetInnerHTML` for untrusted input. All URLs and labels are rendered using standard React virtual DOM bindings.
