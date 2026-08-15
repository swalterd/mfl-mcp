# Security Policy

## Supported versions

Security fixes are applied to the latest `main` branch and the newest published release when applicable.

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead:

1. Use GitHub's private vulnerability reporting for this repository if enabled, or
2. Contact the repository owner privately through GitHub.

Include:

- a description of the issue
- steps to reproduce
- potential impact
- any suggested fix, if you have one

Do not include real MFL passwords, API keys, or live session cookies in reports unless absolutely necessary. Prefer redacted examples.

## Sensitive configuration

This project expects users to store credentials in local environment variables / MCP client config:

- `MFL_USERNAME`
- `MFL_PASSWORD`
- `MFL_APIKEY`

Never commit `.env` files or credential dumps.

## Scope notes

- This project is an unofficial MyFantasyLeague client.
- Follow MFL's API terms and rate-limit guidance.
- Mutations are preview-gated (`confirm: true`) and can be disabled with `MFL_MCP_READ_ONLY=true`.
