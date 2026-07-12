# Security Policy

## Supported versions

IssueFit is pre-alpha. Only the latest state of the `main` branch is supported.

## Reporting a vulnerability

Please do **not** report security vulnerabilities through public GitHub issues, discussions,
or pull requests.

Report vulnerabilities privately using one of:

1. **GitHub private vulnerability reporting** — use _Security → Report a vulnerability_ on the
   repository (preferred).
2. **Email** — msesay@dee-empire.com with the subject line `IssueFit security report`.

Include as much of the following as you can:

- A description of the vulnerability and its impact.
- Steps to reproduce, ideally with a proof of concept.
- Affected components (web app, worker, database package, CI).
- Any suggested remediation.

## What to expect

- Acknowledgement of your report within **72 hours**.
- A status update within **7 days**, including an initial severity assessment.
- Credit in the release notes once a fix ships, unless you prefer to remain anonymous.

Please give us reasonable time to fix the issue before any public disclosure.

## Scope notes

- Secrets must never be committed to the repository; report any committed secret immediately.
- GitHub webhook payloads are only trusted after signature verification.
- AI-generated output is treated as untrusted input and validated before use.
