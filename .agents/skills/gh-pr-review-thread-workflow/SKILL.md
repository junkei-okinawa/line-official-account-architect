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

Reply mutation:

```bash
gh api graphql \
  -F threadId="PRRT_xxx" \
  -f body="Reason or fix summary here." \
  -f query='
    mutation($threadId: ID!, $body: String!) {
      addPullRequestReviewThreadReply(
        input: { pullRequestReviewThreadId: $threadId, body: $body }
      ) { __typename }
    }'
```

### 5. Resolve All Threads After Replies

Resolve each replied thread:

```bash
gh api graphql \
  -F threadId="PRRT_xxx" \
  -f query='
    mutation($threadId: ID!) {
      resolveReviewThread(input: { threadId: $threadId }) {
        thread { id }
      }
    }'
```

### Notes

- `addPullRequestReviewThreadReply` uses `pullRequestReviewThreadId` (not `threadId`) in the input object.
- Resolve only after every thread has a reply.
