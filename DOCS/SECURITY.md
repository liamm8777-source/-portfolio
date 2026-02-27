# Security Guidelines

## Defaults
- Assume all input is untrusted.
- Escape and validate user input.

## HTTP
- Use interceptors for auth tokens.
- Never store secrets in frontend code.

## Browser
- Follow Content Security Policy best practices.
- Avoid direct DOM manipulation.
