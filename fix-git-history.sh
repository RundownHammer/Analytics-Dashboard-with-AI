#!/bin/bash

# This script removes the Groq API key from Git history
# WARNING: This rewrites history - only run if you haven't shared this repo yet

echo "🔧 Fixing Git history to remove API keys..."

# Remove the old commits with secrets
git reset --soft 2818338ade22fae5dc36eed4c41b375f36b5b9cd

# Stage all current files (which have placeholders, not secrets)
git add .

# Create a new clean commit
git commit -m "Initial commit - clean version without secrets"

echo "✅ Git history cleaned!"
echo ""
echo "⚠️  Now you need to force push to GitHub:"
echo "   git push origin master --force"
echo ""
echo "⚠️  WARNING: This will overwrite GitHub history!"
echo "   Only do this if you're the only one working on this repo."
