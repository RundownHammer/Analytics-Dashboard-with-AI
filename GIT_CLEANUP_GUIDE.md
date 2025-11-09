# Fix Git History - Remove API Keys

## The Problem
Your Groq API key is in these commits:
- 9f4e9375d4280addd4e383837d53684e40d8c186
- 2818338ade22fae5dc36eed4c41b375f36b5b9cd

## Solution: Rewrite History

### Step 1: Backup your current work
```bash
cd /d/Projects/analytics
git branch backup-before-cleanup
```

### Step 2: Interactive rebase to remove old commits
```bash
git rebase -i --root
```

In the editor that opens:
- Change "pick" to "drop" for commits 9f4e937 and 2818338
- Save and close

OR simpler:

### Step 3: Create fresh history
```bash
# Go back to before the bad commits
git checkout --orphan new-main

# Add all current files (which are clean)
git add .

# Create new initial commit
git commit -m "Initial commit - Analytics Dashboard with AI

- Next.js frontend with dashboard and chat
- Express.js API
- Python Vanna AI service with Groq
- PostgreSQL database with Prisma
- Complete deployment documentation
- No secrets included"

# Delete old branch
git branch -D master

# Rename new branch to master
git branch -m master

# Force push to GitHub
git push origin master --force
```

### Step 4: Verify
```bash
# Check that no secrets are in history
git log --all --full-history -- README.md
git log --all --full-history -- "docs/*"
```

### Important Notes
⚠️ **Force push overwrites GitHub history**
- Only do this if you're the only one working on the repo
- Anyone who cloned before will need to re-clone

✅ **After this:**
- Your API key will be completely removed from Git
- Only clean files will be in history
- You can push without issues
