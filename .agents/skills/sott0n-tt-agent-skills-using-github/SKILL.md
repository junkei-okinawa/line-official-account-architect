---
name: using-github
description: 'Operates GitHub via gh CLI. Use when user wants to view PRs, commits, issues, or perform git blame.'
---

# Using GitHub

GitHub operations are performed using the `gh` CLI tool.

## Prerequisites Check (Run First)

Before any GitHub operation, verify gh CLI is installed and authenticated.

### Step 1: Check Installation

```bash
which gh
```

### Step 2: Install if Missing

Detect OS and install accordingly:

```bash
# Check OS
uname -s
```

**macOS (Homebrew):**

```bash
brew install gh
```

**Ubuntu/Debian:**

```bash
(type -p wget >/dev/null || (sudo apt update && sudo apt-get install wget -y)) \
  && sudo mkdir -p -m 755 /etc/apt/keyrings \
  && out=$(mktemp) && wget -nv -O$out https://cli.github.com/packages/githubcli-archive-keyring.gpg \
  && cat $out | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
  && sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
  && sudo apt update \
  && sudo apt install gh -y
```

### Step 3: Check Authentication

```bash
gh auth status
```

### Step 4: Authenticate if Needed

If not authenticated, prompt user to run:

```bash
gh auth login
```

This is interactive - let the user complete it manually.

---

## Common Operations

### Pull Requests

| Command                                               | Description                    |
| ----------------------------------------------------- | ------------------------------ |
| `gh pr list`                                          | List open PRs                  |
| `gh pr view <number>`                                 | View PR details                |
| `gh pr diff <number>`                                 | Show PR diff                   |
| `gh pr checks <number>`                               | View CI status                 |
| `gh pr comments <number>`                             | View PR comments               |
| `gh api repos/{owner}/{repo}/pulls/{number}/comments` | Get PR review comments via API |

### Commits

| Command                                     | Description            |
| ------------------------------------------- | ---------------------- |
| `git log --oneline -n 20`                   | Recent commits         |
| `gh api repos/{owner}/{repo}/commits/{sha}` | Commit details via API |
| `gh browse <sha>`                           | Open commit in browser |

### Git Blame

| Command                             | Description                  |
| ----------------------------------- | ---------------------------- |
| `git blame <file>`                  | Show line-by-line authorship |
| `git blame -L 10,20 <file>`         | Blame specific line range    |
| `git blame -L :functionName <file>` | Blame specific function      |
| `git log --follow -p <file>`        | Full file history with diffs |

### Issues

| Command                  | Description        |
| ------------------------ | ------------------ |
| `gh issue list`          | List open issues   |
| `gh issue view <number>` | View issue details |
| `gh issue create`        | Create new issue   |

### Repository Info

| Command                       | Description       |
| ----------------------------- | ----------------- |
| `gh repo view`                | View repo details |
| `gh api repos/{owner}/{repo}` | Repo info via API |

---

## Advanced: GitHub GraphQL API for Review Threads

When you need to manage PR review threads (reply to comments, resolve discussions), use the GraphQL API.

### Key Mutations for Review Thread Management

#### 1. Add Reply to Review Thread

```bash
gh api graphql -F threadId="PRRT_<thread_id>" \
  -f body='✅ コメントの返信内容' \
  -f query='mutation($threadId: ID!, $body: String!) {
    addPullRequestReviewThreadReply(input: { pullRequestReviewThreadId: $threadId, body: $body }) { __typename }
  }'
```

**Important**: Use `pullRequestReviewThreadId` (not `threadId`) as the parameter name!

#### 2. Delete Single Comment in Thread

```bash
gh api graphql -F commentId="PRRC_<comment_id>" \
  -f query='mutation($commentId: ID!) {
    deletePullRequestReviewComment(input: { id: $commentId }) { clientMutationId }
  }'
```

#### 3. Resolve Review Thread

```bash
gh api graphql -F threadId="PRRT_<thread_id>" \
  -f query='mutation($threadId: ID!) {
    resolveReviewThread(input: { threadId: $threadId }) { thread { id } }
  }'
```

#### 4. Get Review Threads with Comments

```bash
gh api graphql -F number=2 \
  -f query='query($number: Int!) {
    repository(owner: "junkei-okinawa", name: "line-official-account-architect") {
      pullRequest(number: $number) {
        reviewThreads(last: 100) {
          nodes { id isResolved comments(first: 50) { nodes { id body createdAt } } }
        }
      }
    }
  }' | jq '.data.repository.pullRequest.reviewThreads.nodes[] | .id as $tid | .comments.nodes[] | select(.body | contains("✅")) | {threadId: $tid, commentId: .id}'
```

### Common Patterns

#### Pattern A: Delete Single Comment → Post Thread Reply

When a single comment was posted instead of a thread reply:

1. **Get the comment ID** within each review thread
2. **Delete the single comment**: `deletePullRequestReviewComment`
3. **Post proper thread reply**: `addPullRequestReviewThreadReply`

#### Pattern B: Bulk Resolve All Threads

After replying to all threads, resolve them in parallel:

```bash
gh api graphql -F threadId="PRRT_..." -f query='...' && \
gh api graphql -F threadId="PRRT_..." -f query='...' && \
...
```

### Variable Naming Gotchas

| Mutation                          | Input Object                           | Parameter Name                               |
| --------------------------------- | -------------------------------------- | -------------------------------------------- |
| `addPullRequestReviewThreadReply` | `AddPullRequestReviewThreadReplyInput` | `pullRequestReviewThreadId` (NOT `threadId`) |
| `resolveReviewThread`             | `ResolveReviewThreadInput`             | `threadId`                                   |
| `deletePullRequestReviewComment`  | `DeletePullRequestReviewCommentInput`  | `id`                                         |

### Payload Field Names

Some mutations return different payload structures:

- `addPullRequestReviewThreadReply` → `AddPullRequestReviewThreadPayload` (no `replyEdge`)
- Use `__typename` to check the response type if unsure

---

## Tips for Review Thread Management

1. **Always verify thread structure first** using GraphQL query before attempting mutations
2. **Use parallel execution** (`&&`) when resolving multiple threads
3. **Check `isResolved` status** after each operation
4. **Thread replies require proper parameter names** - this is a common pitfall!
