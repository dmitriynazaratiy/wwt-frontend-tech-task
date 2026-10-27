## CI/CD and GitHub Actions

### Decision 1: pin pnpm version

Require pnpm `12.15.0` through `engines.pnpm` in `package.json` and use the same version in GitHub Actions. This rejects installation with a different pnpm version without adding package-manager dependencies to the lockfile. Pinning prevents unexpected installation changes and makes upgrades deliberate and testable.

### Decision 2: explicitly approve dependency builds

Allow build scripts for `@swc/core` and `esbuild` in `pnpm-workspace.yaml` so dependency installation runs without interactive approval. Without these settings, pnpm stops with `ERR_PNPM_IGNORED_BUILDS` before CI can build or check the project. Explicit approvals enable the required scripts while keeping unreviewed dependency scripts blocked.

### Decision 3: use Node 24 LTS for automated CI

Run checks automatically on Node 24 and keep other versions available for manual compatibility checks. This reduces duplicate CI work while using a supported LTS version that receives security updates. Node 18 and 20 are end-of-life and no longer receive official security patches.

**Example:** The October 2026 security release fixed a remote code execution vulnerability (CVE-2026-111497), with the fix included in Node 24.22.1. Node 18 and 20 are end-of-life and will not receive official security fixes, including this one. [Official advisory](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)
