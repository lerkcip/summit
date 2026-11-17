#!/bin/sh
# Builds the SUMMIT GitHub repository from the working copy, keeping any existing .git history.
# usage: sh build_repo.sh <workDir> <scriptsDir> <outDir> [pagesUrl]
set -e
W=$(cd "$1" && pwd); SC=$(cd "$2" && pwd); O=$3; URL=${4:-https://YOUR-USERNAME.github.io/summit/}
T="$O.build"; rm -rf "$T"; mkdir -p "$T"
# the site, served by GitHub Pages from the repository root
(cd "$W/app" && tar --exclude='./_py' -cf - .) | (cd "$T" && tar -xf -)
cp "$W/node_modules/katex/LICENSE" "$T/vendor/katex/LICENSE"
: > "$T/.nojekyll"
# the tools and sources behind it
mkdir -p "$T/dev/scripts" "$T/dev/build"
(cd "$SC" && tar --exclude='__pycache__' -cf - .) | (cd "$T/dev/scripts" && tar -xf -)
(cd "$W" && tar --exclude='__pycache__' -cf - unpack hover) | (cd "$T/dev" && tar -xf -)
cp "$W/build/curriculum.json" "$T/dev/build/"
cp "$W/package.json" "$W/package-lock.json" "$T/dev/"
sed "s#{{PAGES_URL}}#$URL#" "$W/repo_docs/README.md" > "$T/README.md"
cp "$W/repo_docs/dev_README.md" "$T/dev/README.md"
printf '_py\ndev/node_modules/\n.DS_Store\n' > "$T/.gitignore"
# keep history, swap the tree
if [ -d "$O/.git" ]; then mv "$O/.git" "$T/.git"; fi
rm -rf "$O"; mv "$T" "$O"
echo "built $O"
