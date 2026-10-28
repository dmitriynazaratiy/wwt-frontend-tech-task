## CI/CD and GitHub Actions

### Decision 1: pin pnpm version

Require pnpm `12.15.0` through `engines.pnpm` in `package.json` and use the same version in GitHub Actions. This rejects installation with a different pnpm version without adding package-manager dependencies to the lockfile. Pinning prevents unexpected installation changes and makes upgrades deliberate and testable.

### Decision 2: explicitly approve dependency builds

Allow build scripts for `@swc/core` and `esbuild` in `pnpm-workspace.yaml` so dependency installation runs without interactive approval. Without these settings, pnpm stops with `ERR_PNPM_IGNORED_BUILDS` before CI can build or check the project. Explicit approvals enable the required scripts while keeping unreviewed dependency scripts blocked.

### Decision 3: use Node 24 LTS for automated CI

Run checks automatically on Node 24 and keep other versions available for manual compatibility checks. This reduces duplicate CI work while using a supported LTS version that receives security updates. Node 18 and 20 are end-of-life and no longer receive official security patches.

**Example:** The October 2026 security release fixed a remote code execution vulnerability (CVE-2026-111497), with the fix included in Node 24.22.1. Node 18 and 20 are end-of-life and will not receive official security fixes, including this one. [Official advisory](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)

### Decision 4: run every pipeline step with pnpm, including tests

Run build, format, lint and test scripts through pnpm instead of npm. The pipeline already installs dependencies with the pinned pnpm version, so using the same tool for scripts keeps the toolchain consistent. Tests run once with `--passWithNoTests`, so the pipeline stays green before the first test files are added and still fails on any broken test.

## Dependencies and packages

### Decision 1: upgrade React Router to v7

Upgrade `react-router` and `react-router-dom` to v7 because the latest v6 patch does not resolve all reported security advisories. The redirect and SSR hydration fixes are available in v7.18.0 and later. Using the upstream fixes avoids maintaining custom security patches. React Router v7 requires Node 20 or newer, so remove Node 18 from the manual CI choices. [Redirect advisory](https://github.com/remix-run/react-router/security/advisories/GHSA-wrjc-x8rr-h8h6), [SSR hydration advisory](https://github.com/remix-run/react-router/security/advisories/GHSA-337j-9hxr-rhxg)
