#!/bin/bash

rm -r ../node_modules
rm -r ../shared/node_modules
rm -r ../client/node_modules
rm -r ../server/node_modules

rm ../package-lock.json
rm ../shared/package-lock.json
rm ../client/package-lock.json
rm ../server/package-lock.json

rm -r ../shared/dist
rm -r ../client/dist
rm -r ../server/dist

rm -r ../server/stage
rm -r ../client/stage
