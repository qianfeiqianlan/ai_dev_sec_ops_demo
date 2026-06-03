import { readFileSync } from 'node:fs';

const eventPath = process.env.GITHUB_EVENT_PATH;

if (!eventPath) {
  console.log('GITHUB_EVENT_PATH is not set. Skipping PR policy check outside GitHub Actions.');
  process.exit(0);
}

const event = JSON.parse(readFileSync(eventPath, 'utf8'));
const pullRequest = event.pull_request;

if (!pullRequest) {
  console.log('No pull_request payload found. Skipping PR policy check.');
  process.exit(0);
}

const title = pullRequest.title ?? '';
const branch = pullRequest.head?.ref ?? '';
const titlePattern =
  /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([a-z0-9._-]+\))?!?: .+/;
const branchPattern =
  /^(feature|feat|fix|bugfix|hotfix|chore|docs|test|refactor|release|codex)\/[a-z0-9._-]+$/;

const failures = [];

if (!titlePattern.test(title)) {
  failures.push(`PR title must follow Conventional Commits, got: "${title}"`);
}

if (!branchPattern.test(branch)) {
  failures.push(
    `Branch name must look like "feat/something" or "fix/something", got: "${branch}"`,
  );
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('PR policy check passed.');
