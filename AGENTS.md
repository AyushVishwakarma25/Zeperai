# Project Guardrails & Architectural Invariants (zeperai.in)

> **CRITICAL**: This is a live production application with real users, payments, and admin access. All future AI sessions MUST strictly obey the following rules.

---

### 1. Hardened Admin Authentication & Zero-Trust Security
- **No Hardcoded Secrets or Fallback Credentials**:
  - Admin login MUST ONLY succeed via exact, constant-time comparison (`crypto.timingSafeEqual`) against the environment variables `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET`.
  - If any of these environment variables are missing or empty, the server and API handlers MUST fail closed immediately (return an error). Never fall back to default usernames, passwords, or secrets baked into the code.
  - Never accept hardcoded credentials or fallback strings (e.g. `'admin'`, `'MadMan'`, `'197325'`, `'ayushlogin'`, `'logmein25'`).
- **Strict Email Authorization**:
  - Never grant admin access via loose substring matching (e.g. `email.includes('admin')`).
  - Email-based admin checks must strictly use an exact match against the comma-separated environment allowlist `ADMIN_ALLOWED_EMAILS` or verified database role metadata (`user_metadata.is_admin === true`).
- **No Client-Side Token Generation**:
  - Tokens must never be forged or signed client-side. All admin authentication requires a real server round-trip.

---

### 2. Mandatory `.js` Extensions on Relative Imports (ESM / Node / Vercel)
- `package.json` specifies `"type": "module"`.
- **ALL** relative imports across the codebase (`./...` and `../...`) in both frontend and backend (`server.ts`, `api/`, `config/`, `utils/`, `services/`, `components/`, `src/`) **MUST** explicitly end with `.js` (e.g. `import { app } from '../server.js'`).
- Missing extensions cause `ERR_MODULE_NOT_FOUND` in production serverless runtimes.
- Always verify all relative static and dynamic imports include `.js` before completing tasks.

---

### 3. Change Hygiene
- Preserve existing security controls, fail-closed handlers, and timing-safe comparisons when adding features.
- Avoid full file rewrites; perform targeted, surgical edits.
