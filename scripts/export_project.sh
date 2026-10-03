#!/usr/bin/env bash
# ==============================================================================
# SmritiSaathi Clean Export Script for GitHub & Distribution
# This script bundles all src/, public/, configs, and documentation into a clean
# zip/tarball without heavy node_modules or cache files, ready to upload or push.
# ==============================================================================

set -e

EXPORT_NAME="smritisathi-complete-source-$(date +%Y%m%d)"
OUTPUT_FILE="${EXPORT_NAME}.tar.gz"

echo "📦 Packaging complete SmritiSaathi project..."
echo "📁 Including: src/, public/, package.json, vite.config.ts, tsconfig.json, etc."
echo "🚫 Excluding: node_modules, .git, dist, build artifacts"

tar \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='dist' \
  --exclude='.aistudio' \
  --exclude='*.tar.gz' \
  -czvf "${OUTPUT_FILE}" .

echo "✅ Successfully created clean archive: ${OUTPUT_FILE}"
echo "💡 To push directly to a friend's GitHub repo, run:"
echo "   git init"
echo "   git add ."
echo "   git commit -m 'Initial commit of complete SmritiSaathi codebase'"
echo "   git remote add origin https://github.com/FRIEND_USERNAME/REPO_NAME.git"
echo "   git push -u origin main --force"
