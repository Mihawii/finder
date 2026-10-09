---
name: Always Commit After Changes
description: Every agent must git add and commit immediately after making code changes - never skip or batch commits
type: feedback
---

# Rule: Always Commit After Changes

Every agent must run the following after making any updates to the codebase:
```bash
git add .
git commit -m "descriptive message of changes"
```

- Commit immediately after each logical change
- Do not batch multiple tasks into one commit
- Use descriptive commit messages
- This is a hard requirement from the user
