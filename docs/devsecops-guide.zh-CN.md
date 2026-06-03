# GitHub DevSecOps 全链路实践说明

这份文档面向还不熟悉 DevSecOps 流程的人，介绍当前项目如何把本地开发、代码评审、CI 检查、安全扫描、AI Code Review、发布、Docker 镜像和镜像安全串成一条完整链路。

项目本身是一个 NestJS API Demo，但重点不是业务复杂度，而是展示一套团队可以复用的工程流程。

## 这个项目解决什么问题

很多项目一开始只有“能运行”的代码，但缺少稳定的协作和交付流程。常见问题包括：

- 代码提交前没有统一格式和 lint 检查，PR 中充满风格问题。
- Commit message 不规范，后续无法自动生成 changelog。
- 单元测试和 API 测试依赖开发者自觉执行，容易漏跑。
- 依赖漏洞、密钥泄露、代码安全问题发现太晚。
- Code review 完全依赖人工，容易忽略测试覆盖、异常处理、安全边界。
- Release、Docker 镜像、镜像扫描、SBOM 没有串起来，交付产物不可追溯。

这个 Demo 的目标是把这些问题前移、自动化、可视化，让每一次变更都经过清晰的质量和安全门禁。

## 当前项目做了哪些事情

当前项目实现了三层门禁：

| 阶段         | 发生位置                 | 目标                                         |
| ------------ | ------------------------ | -------------------------------------------- |
| 本地开发门禁 | 开发者电脑               | 在提交和推送前尽早发现低成本问题             |
| PR 门禁      | GitHub Pull Request      | 在合并前强制执行质量、安全、策略和 AI Review |
| 发布交付门禁 | GitHub Release / Actions | 在发布时生成可交付、可扫描、可追溯的产物     |

## 本地开发门禁

本地门禁由 Husky Git Hooks 驱动，目的是让开发者在代码离开本机前就拿到快速反馈。

当前配置包括：

- `pre-commit`：执行 `lint-staged`
- `commit-msg`：执行 `commitlint`
- `pre-push`：执行单元测试和 API/e2e 测试

对应文件：

- `.husky/pre-commit`
- `.husky/commit-msg`
- `.husky/pre-push`
- `lint-staged.config.cjs`
- `commitlint.config.cjs`
- `cspell.json`

### pre-commit 做什么

`pre-commit` 会在提交前处理 staged 文件：

- 使用 Prettier 统一格式。
- 使用 ESLint 修复 TypeScript 代码问题。
- 使用 cspell 做拼写检查。

这样可以减少 PR 中的格式噪音，让 reviewer 更专注于业务逻辑和设计问题。

### commit-msg 做什么

`commit-msg` 会检查提交信息是否符合 Conventional Commits，例如：

```text
feat: add armstrong number API
fix: harden security workflows
chore: initialize baseline
```

这样做的好处是：

- 提交历史更容易阅读。
- 可以自动生成 changelog。
- release-please 能根据提交类型判断版本发布内容。

### pre-push 做什么

`pre-push` 会在推送前执行：

```bash
pnpm run test:ci
pnpm run test:e2e:ci
```

这可以避免明显失败的代码被推到远端，减少 CI 资源浪费。

## PR 门禁

PR 门禁由 GitHub Actions 执行。它是团队协作中的“不可绕过检查”，即使有人跳过了本地 hook，GitHub 上仍然会重新验证。

当前项目包含这些 PR 相关 workflows：

| Workflow                          | 作用                                                                 |
| --------------------------------- | -------------------------------------------------------------------- |
| `.github/workflows/ci.yml`        | 执行格式检查、lint、拼写检查、单元测试、API/e2e 测试、覆盖率和 build |
| `.github/workflows/pr-policy.yml` | 检查 PR 标题和分支命名                                               |
| `.github/workflows/security.yml`  | 执行依赖审计、Gitleaks 密钥扫描、Semgrep SAST                        |
| `.github/workflows/codeql.yml`    | 执行 GitHub CodeQL 语义静态扫描                                      |
| `.github/workflows/ai-review.yml` | 使用 Claude Code 进行 AI Code Review                                 |

### CI 检查

`ci.yml` 是最基础的质量门禁。它证明代码至少满足这些条件：

- 依赖可以正常安装。
- 代码格式符合 Prettier。
- TypeScript 代码通过 ESLint。
- 文档和代码没有明显拼写问题。
- 单元测试通过。
- Supertest API/e2e 测试通过。
- 覆盖率命令可以运行。
- NestJS 项目可以成功 build。

这些检查越早失败越好，因为它们通常是确定性问题，不应该消耗人工 reviewer 的时间。

### PR 策略检查

`pr-policy.yml` 会执行 `scripts/check-pr-policy.mjs`，检查：

- PR 标题是否符合 Conventional Commits。
- 分支命名是否符合团队约定。
- Dependabot 分支是否允许通过。

例如允许：

```text
feat/armstrong-number-api
fix/security-workflow
dependabot/npm_and_yarn/types/node-25.9.1
```

这样做可以让团队的分支、PR、提交信息保持一致，后续自动发布也更顺畅。

### 安全扫描

`security.yml` 包含三类检查：

- `pnpm audit`：检查依赖漏洞。
- Gitleaks：检查是否误提交 token、密码、密钥等敏感信息。
- Semgrep：基于规则扫描常见安全风险和不安全写法。

安全扫描放在 PR 阶段的好处是：问题还没有进入主分支，修复成本最低。

### CodeQL

`codeql.yml` 使用 GitHub CodeQL 对 JavaScript/TypeScript 做语义级静态分析。

和普通 grep 或 lint 不同，CodeQL 能理解一部分代码数据流和调用关系，适合发现更深层的安全问题。

### AI Code Review

`ai-review.yml` 使用 Claude Code 做 AI 辅助评审。它重点关注：

- 代码正确性。
- 测试是否覆盖关键路径。
- API 行为是否合理。
- 输入校验和异常处理是否充分。
- 是否引入安全风险。
- CI/CD 配置变更是否可疑。

AI Review 不是替代人工 reviewer，而是给人工 reviewer 增加一层自动化检查。它适合发现“容易被人忽略但值得确认”的问题。

## 发布交付门禁

当代码进入主分支后，发布阶段负责把源码变成可交付产物。

当前项目包含这些发布相关 workflows：

| Workflow                               | 作用                                                  |
| -------------------------------------- | ----------------------------------------------------- |
| `.github/workflows/release.yml`        | 使用 release-please 创建 release PR 或 GitHub Release |
| `.github/workflows/docker.yml`         | 构建 Docker 镜像并推送到 GHCR                         |
| `.github/workflows/image-security.yml` | 扫描 Docker 镜像并生成 SBOM                           |

### Release 自动化

`release.yml` 使用 release-please。它会根据 Conventional Commits 自动生成：

- release PR
- changelog
- GitHub Release
- 版本变更记录

这要求团队坚持规范提交信息，否则自动发布工具无法准确理解变更类型。

### Docker 镜像构建

项目提供了 `Dockerfile`，使用多阶段构建：

- 第一阶段安装依赖。
- 第二阶段 build NestJS 项目。
- 最终阶段只保留运行所需文件。

这样可以减少镜像体积，也能降低运行镜像里的攻击面。

### 镜像安全与 SBOM

`image-security.yml` 会做两件重要的事：

- 使用 Trivy 扫描镜像漏洞。
- 生成 SBOM，也就是 Software Bill of Materials。

SBOM 可以理解为软件物料清单，它记录镜像里包含哪些依赖和组件。当未来某个依赖爆出漏洞时，团队可以快速判断哪些镜像受影响。

## 当前业务 Demo

项目中还实现了一个简单业务功能，用来演示完整 PR 流程：

```http
GET /armstrong/:value
```

它用于判断一个数字是否为水仙花数。

例如：

```http
GET /armstrong/153
```

返回：

```json
{
  "value": 153,
  "isArmstrong": true
}
```

这个功能配套了：

- controller 单元测试
- Supertest API/e2e 测试
- 输入校验
- 400 错误场景测试

这让它成为一个很适合演示 PR 全链路的最小业务变更。

## 完整协作流程

一个开发者从开发到合并，大致会经历下面的步骤：

1. 从主分支创建 feature 分支。
2. 修改 NestJS 业务代码。
3. 本地提交时触发 `pre-commit` 和 `commit-msg`。
4. 推送前触发 `pre-push` 测试。
5. 推送分支到 GitHub。
6. 创建 Pull Request。
7. GitHub Actions 自动执行 CI、策略检查、安全扫描、CodeQL、AI Review。
8. 如果检查失败，开发者修复后再次 push。
9. 所有必需检查通过后，合并 PR。
10. 主分支进入 release 和镜像交付流程。

## 这样做有什么好处

### 对开发者

- 提交前就能发现格式、lint、拼写、测试问题。
- 不用记住每个检查命令，hook 和 CI 会自动执行。
- PR 反馈更明确，修复路径更清楚。

### 对 reviewer

- 少看格式类问题，多关注设计、可维护性和业务风险。
- AI Review 可以补充测试缺口、异常路径、安全边界等提示。
- 安全扫描结果直接出现在 PR 中，不需要额外切换工具。

### 对团队

- 主分支质量更稳定。
- 发布记录和 changelog 可以自动生成。
- 安全问题更早暴露。
- 镜像、SBOM、扫描结果让交付产物更可追溯。
- 新人可以通过这套 Demo 快速理解现代 GitHub DevSecOps 流程。

## 落地时需要注意什么

### 本地 hook 不要太重

本地 hook 应该提供快速反馈。如果每次提交都跑很重的检查，开发体验会变差。

建议：

- `pre-commit` 跑轻量检查。
- `pre-push` 跑测试。
- 更重的安全扫描和镜像扫描放到 GitHub Actions。

### GitHub Actions 是最终门禁

本地 hook 可以被跳过，所以不能只依赖本地检查。真正的合并门禁应该配置在 GitHub branch protection 里。

建议在 GitHub 仓库中启用：

- Require status checks before merging
- Require pull request before merging
- Require branches to be up to date before merging

### AI Review 要当作辅助

AI Review 很适合发现遗漏，但它不是确定性工具。

建议：

- 不让 AI Review 替代人工审批。
- 不让 AI Review 成为唯一安全门禁。
- 将 AI Review 的重点放在风险提示和测试建议上。

### Workflow 变更最好单独 PR

GitHub 对 PR 中修改 workflow 有安全限制。像 Claude Code 这样的 GitHub App Action，通常要求 workflow 文件在默认分支已经存在，并且与 PR 分支内容一致。

因此建议：

- 基础设施和 workflow 调整单独开 PR。
- 业务功能 PR 尽量只改业务代码和测试。
- 先合并 workflow 修复，再让业务 PR 使用新的 workflow。

## 推荐给新人的学习顺序

如果一个人完全不了解这套流程，可以按下面顺序理解：

1. 先看 `README.md`，了解项目整体目标。
2. 再看 `docs/devsecops-flow.md`，通过 Mermaid 图理解全链路。
3. 看 `.husky/` 和 `lint-staged.config.cjs`，理解本地门禁。
4. 看 `.github/workflows/ci.yml`，理解基础 CI。
5. 看 `.github/workflows/security.yml` 和 `codeql.yml`，理解安全扫描。
6. 看 `.github/workflows/ai-review.yml`，理解 AI Review。
7. 看 `release.yml`、`docker.yml`、`image-security.yml`，理解发布和镜像安全。
8. 最后看水仙花数 API 的 PR，理解一次真实变更如何走完整流程。

## 总结

这套 Demo 展示的是一个小项目如何具备相对完整的 DevSecOps 能力。

它的核心思想是：

- 本地尽早反馈。
- PR 阶段强制验证。
- 安全检查前移。
- AI Review 辅助人工评审。
- 发布产物可追溯。
- 镜像交付可扫描、可审计。

当团队把这些流程自动化之后，质量和安全不再依赖“每个人都记得做正确的事”，而是变成项目默认会执行的工程机制。
