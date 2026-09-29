# Contributing to MigrationMap

Thank you for your interest in contributing to MigrationMap!

## Code of Conduct

Please treat everyone with respect and empathy. We are committed to providing a welcoming, inclusive, and harassment-free experience for everyone.

## Development Workflow

### 1. Prerequisites
- Node.js 18+ or 20+
- npm (or pnpm / yarn)

### 2. Setup
```bash
git clone https://github.com/your-username/migrationmap.git
cd migrationmap
npm install
```

### 3. Local Development
```bash
npm run dev
```
Navigate to `http://localhost:3000`.

### 4. Verification Checklist Before Pull Requests
Make sure your changes pass all checks:
```bash
# 1. Typecheck
npm run lint

# 2. Pipeline Test Suite (34 automated tests)
npm test

# 3. Production Build
npm run build
```

## Architecture Principles
1. **Zero Unnecessary Dependencies:** Keep bundle size minimal and deterministic.
2. **Client-Side Privacy:** Never introduce backend routes or external telemetry that transfers user migration data to third-party endpoints.
3. **No Formula Injection:** Ensure any export utilities sanitize untrusted text inputs.
4. **Accessible UI:** Ensure responsive support from 320px to 4K displays and clear contrast in both light and dark themes.
