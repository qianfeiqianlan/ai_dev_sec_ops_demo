# DevSecOps Flow

This document describes the planned end-to-end CR/MR and CI/CD flow for the NestJS AI DevSecOps demo.

The design separates the pipeline into local checks, pull request checks, and release checks. That keeps the demo easy to explain and makes each gate responsible for a clear outcome.

## Full Pipeline

```mermaid
flowchart TD
  A["Developer changes NestJS code"] --> B["Local quality gate"]

  subgraph Local["Local developer machine"]
    B --> B1["Format and lint staged files"]
    B --> B2["Spelling check"]
    B --> B3["Commit message validation"]
    B --> B4["Unit tests"]
    B --> B5["Supertest API/e2e tests"]
  end

  B1 --> C["Push feature branch"]
  B2 --> C
  B3 --> C
  B4 --> C
  B5 --> C

  C --> D["Open pull request"]

  subgraph PR["Pull request gate on GitHub"]
    D --> E1["CI: install, lint, test, coverage"]
    D --> E2["Policy: PR title, branch naming, commits"]
    D --> E3["Dependency security scan"]
    D --> E4["Secret scanning"]
    D --> E5["SAST and CodeQL"]
    D --> E6["AI code review with Claude Code"]
  end

  E1 --> F{"Required checks pass?"}
  E2 --> F
  E3 --> F
  E4 --> F
  E5 --> F
  E6 --> F

  F -- "No" --> G["Fix code, tests, or security findings"]
  G --> B

  F -- "Yes" --> H["Merge to main"]
  H --> I["Main branch verification"]
  I --> J["Create tag or GitHub Release"]

  subgraph Release["Release and delivery gate"]
    J --> K1["Generate changelog and release notes"]
    J --> K2["Build Docker image"]
    K2 --> K3["Scan Docker image"]
    K2 --> K4["Generate SBOM"]
    K3 --> K5["Sign image"]
    K4 --> K5
    K5 --> K6["Publish image to registry"]
    K1 --> K7["Publish GitHub Release"]
    K6 --> K7
  end

  K7 --> L["Auditable release artifact"]
```

## Gate Responsibilities

| Gate | Purpose | Typical tools |
| --- | --- | --- |
| Local developer gate | Give developers fast feedback before pushing code. | ESLint, Prettier, cspell, Jest, Supertest, Husky, lint-staged, commitlint |
| Pull request gate | Enforce non-bypassable quality, test, policy, and security checks before merge. | GitHub Actions, pnpm, Jest, Supertest, CodeQL, Semgrep, Gitleaks, Dependabot, Claude Code |
| Release gate | Produce auditable release artifacts and container images. | release-please or semantic-release, Docker Buildx, GHCR, Trivy, Syft, Cosign |

## Planned Workflow Map

```mermaid
flowchart LR
  PR["Pull request"] --> CI["ci.yml"]
  PR --> POLICY["pr-policy.yml"]
  PR --> SEC["security.yml"]
  PR --> CODEQL["codeql.yml"]
  PR --> AI["ai-review.yml"]

  MAIN["Merge to main"] --> VERIFY["main verification"]
  VERIFY --> TAG["Tag or release"]

  TAG --> RELEASE["release.yml"]
  RELEASE --> DOCKER["docker.yml"]
  DOCKER --> IMAGESEC["image-security.yml"]

  CI --> MERGE{"Merge allowed"}
  POLICY --> MERGE
  SEC --> MERGE
  CODEQL --> MERGE
  AI --> MERGE
```

## Workflow Intent

| Workflow | Responsibility |
| --- | --- |
| `ci.yml` | Proves that the application builds cleanly and passes lint, unit tests, API/e2e tests, spelling checks, and coverage expectations. |
| `pr-policy.yml` | Keeps pull requests and commits compatible with automated releases by enforcing naming and Conventional Commit rules. |
| `security.yml` | Finds dependency vulnerabilities, leaked secrets, and common insecure coding patterns early in the pull request. |
| `codeql.yml` | Provides GitHub-native semantic static analysis for TypeScript and JavaScript code. |
| `ai-review.yml` | Adds Claude Code feedback for correctness, test gaps, API behavior, error handling, and security-sensitive changes. |
| `release.yml` | Creates changelog/release notes and publishes the GitHub Release. |
| `docker.yml` | Builds and publishes the application container image. |
| `image-security.yml` | Scans the image, generates SBOM evidence, and signs the published image when configured. |

## Demo Principles

- Local hooks optimize developer experience, but GitHub Actions remain the source of truth.
- Heavy checks should run remotely so local commits stay fast.
- Security checks should be visible in pull requests, not hidden until release time.
- AI review should assist human reviewers rather than replace required deterministic checks.
- Release artifacts should be traceable: source commit, changelog, image digest, scan result, SBOM, and signature should line up.
