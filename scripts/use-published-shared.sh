#!/bin/bash

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 version"
    exit 1
fi

VERSION=$1
PKG_REF="^$VERSION"

for project in client server; do
    cd "../$project"
    echo "Updating $project/package.json..."
    jq --arg pkg "$PKG_REF" '.dependencies["@aditya-arcot/wealthwatch-shared"] = $pkg' package.json > package.tmp.json
    mv package.tmp.json package.json
    trash package-lock.json node_modules
    echo "Installing $project packages..."
    npm install
done

cd ..
echo "Formatting files..."
npm install
npm run prettier

echo "Done switching to published shared package"
echo "Restart VSCode TS server to refresh module resolution"
