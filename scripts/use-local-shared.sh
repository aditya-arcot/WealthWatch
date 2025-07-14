#!/bin/bash

set -e

cd ../shared
echo "Building shared project..."
npm install
npm run build

for project in client server; do
    cd "../$project"
    echo "Updating $project/package.json..."
    jq '.dependencies["@aditya-arcot/wealthwatch-shared"] = "file:../shared"' package.json > package.tmp.json
    mv package.tmp.json package.json
    trash package-lock.json node_modules
    echo "Installing $project packages..."
    npm install
done

cd ..
echo "Formatting files..."
npm install
npm run prettier

echo "Done switching to local shared package"
echo "Restart VSCode TS server to refresh module resolution"
