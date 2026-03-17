---
name: gh-pr-review-thread-workflow
description: Use when you need to fetch PR review threads via gh api graphql, judge whether each review comment requires code changes, reply in each thread, and resolve all threads after replying. Use for workflows that include listing review threads, posting thread replies, and closing threads on a GitHub PR.
---

# Gh Pr Review Thread Workflow

## Overview

Fetch PR review threads with `gh api graphql`, decide whether each comment needs changes, post thread replies with rationale or results, then resolve all threads.

## Workflow

### 1. Preconditions

Check `gh` is installed and authenticated before any API calls.

```bash
which gh
gh auth status
```

If auth fails, run `gh auth login -h github.com` manually and retry.

### 2. Identify Repo/PR

Get owner/name from the current repo when possible:

```bash
gh repo view --json name,owner -q '.owner.login + " " + .name'
```

Use the PR number provided by the user (e.g., `2`).

### 3. Fetch Review Threads (GraphQL)

```bash
gh api graphql \
  -F owner="OWNER" \
  -F name="REPO" \
  -F number=2 \
  -f query='
query($owner: String!, $name: String!, $number: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      reviewThreads(last: 100) {
        nodes {
          id
          isResolved
          isOutdated
          comments(first: 50) {
            nodes {
              id
              author { login }
              body
              createdAt
            }
          }
        }
      }
    }
  }
}'
```

Focus on `isResolved: false` threads. Determine whether each latest reviewer comment needs changes.

### 4. Decide Response and Reply in Thread

If no change needed, reply with the rationale. If changes needed, implement changes first, then reply with what was done.

**Important Guidelines:**

- Do NOT include reviewer mention (@username) in replies - it is not required
- Use actual line breaks (real newlines) instead of escaped `\n` characters in body text
- Ensure each thread receives exactly ONE reply before proceeding to resolution

Reply mutation:

```bash
gh api graphql \
  -F threadId="PRRT_xxx" \
  -f query='
mutation($threadId: ID!, $body: String!) {
  addPullRequestReviewThreadReply(
    input: { pullRequestReviewThreadId: $threadId, body: $body }
  ) { __typename }
}' \
  -f body="Reason or fix summary here."
```

### 5. Verify No Duplicate Comments Before Resolution

**CRITICAL CHECK**: Before resolving any thread, verify that exactly one reply has been posted to each thread. This prevents duplicate replies and ensures no threads are missed.

To check for duplicates:

```bash
gh api graphql \
  -F owner="OWNER" \
  -F name="REPO" \
  -F number=PR_NUMBER \
  -f query='
query($owner: String!, $name: String!, $number: Int!, $threadId: ID!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $number) {
      reviewThreads(first: 10) {
        nodes {
          id
          isResolved
          comments(last: 10) {
            totalCount
            edges {
              node {
                author { login }
                body
              }
            }
          }
        }
      }
    }
  }
}' \
  -F threadId="PRRT_xxx"
```

Look for threads where `comments.totalCount > 1` and multiple replies are from the same author. If duplicates found, either delete them or proceed only if confirmed as intentional.

### 6. Resolve All Threads After Verification

Only resolve a thread after:

- ✅ Exactly ONE reply has been posted (no duplicates)
- ✅ No other threads were missed in this PR review cycle

Resolve each verified thread:

```bash
gh api graphql \
  -F owner="OWNER" \
  -F name="REPO" \
  -F number=PR_NUMBER \
  -f query='
mutation($threadId: ID!) {
  resolveReviewThread(input: { threadId: $threadId }) {
    thread { id }
  }
}' \
  -F threadId="PRRT_xxx"
```

### Notes

- `addPullRequestReviewThreadReply` uses `pullRequestReviewThreadId` (not `threadId`) in the input object.
- Resolve only after every thread has been verified to have exactly ONE reply.
- Always check for duplicate comments before resolving any thread.
- Ensure no threads are missed - all non-resolved threads from step 3 should be processed.
