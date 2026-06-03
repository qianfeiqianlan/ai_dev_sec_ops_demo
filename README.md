# AI DevSecOps Demo

This repository is a NestJS-based demo project for showing a full GitHub-driven CR/MR and CI/CD DevSecOps workflow.

The goal is to demonstrate how code moves from local development checks, through pull request quality and security gates, into release, Docker image publishing, image scanning, and supply-chain evidence.

> Current status: this repository contains the planning documentation first. Git hooks, GitHub Actions workflows, security scanners, AI review, and release automation will be implemented in the next steps.

## Tech Stack

- NestJS
- TypeScript
- pnpm
- Jest unit tests
- Supertest API/e2e tests
- GitHub Actions, planned
- Docker, planned

## DevSecOps Flow

The end-to-end flow is documented in [docs/devsecops-flow.md](docs/devsecops-flow.md).

At a high level, the demo is split into three gates:

- Local developer gate: fast checks before code leaves the workstation.
- Pull request gate: mandatory quality, test, security, and AI review checks before merge.
- Release gate: changelog, Docker image, image scan, SBOM, signing, and publish steps.

## Planned Workflows

The following GitHub Actions workflows are planned for this demo. They are intentionally separated so each gate has a clear responsibility and can be explained independently.

| Workflow | Trigger | Purpose |
| --- | --- | --- |
| `ci.yml` | Pull request, push to `main` | Runs install, lint, unit tests, API/e2e tests, spelling checks, and coverage generation. |
| `pr-policy.yml` | Pull request | Checks PR title, branch naming, and Conventional Commit style so project history stays release-friendly. |
| `security.yml` | Pull request, push to `main`, scheduled | Runs dependency vulnerability checks, secret scanning, and static analysis. |
| `codeql.yml` | Pull request, push to `main`, scheduled | Runs GitHub CodeQL for semantic code scanning. |
| `ai-review.yml` | Pull request | Uses Claude Code as an AI reviewer for risk-focused feedback on NestJS code, tests, API behavior, and security. |
| `release.yml` | Tag or release branch | Generates release notes/changelog and creates a GitHub Release. |
| `docker.yml` | Release | Builds and pushes the Docker image to the container registry. |
| `image-security.yml` | Release, image publish | Scans the Docker image, generates an SBOM, and optionally signs the image. |

## Local Quality Gates

The local development layer is planned to use Git hooks to catch common issues early:

- `pre-commit`: format staged files, run lint on staged files, and run spelling checks.
- `commit-msg`: validate commit messages with Conventional Commits.
- `pre-push`: run unit tests and API/e2e tests before pushing.

The CI layer will always re-run important checks, because local hooks are a developer convenience rather than the final source of truth.

## Project Commands

Install dependencies:

```bash
pnpm install
```

Run the application:

```bash
pnpm run start:dev
```

Run lint:

```bash
pnpm run lint
```

Run unit tests:

```bash
pnpm run test
```

Run API/e2e tests:

```bash
pnpm run test:e2e
```

Run coverage:

```bash
pnpm run test:cov
```

## Demo Storyline

1. A developer creates a feature branch and changes a NestJS API.
2. Local Git hooks catch formatting, lint, spelling, and commit message issues.
3. The developer opens a pull request on GitHub.
4. CI validates build quality, tests, API behavior, and coverage.
5. Security workflows scan dependencies, secrets, and source code.
6. Claude Code posts an AI review focused on correctness, tests, and security risks.
7. The pull request is merged after required checks pass.
8. A release is created from `main` or a tag.
9. The release pipeline builds a Docker image, scans it, generates SBOM evidence, signs it, and publishes it.

## Implementation Roadmap

- Add local quality tools: `cspell`, `husky`, `lint-staged`, and `commitlint`.
- Add GitHub Actions workflows for CI, policy checks, and security scanning.
- Add AI code review workflow with Claude Code.
- Add Dockerfile and container build workflow.
- Add image scanning, SBOM generation, and optional image signing.
- Add release automation with generated changelog and GitHub Release output.
