#!/bin/bash

# NOTE: This script is used to bundle the recorder.js file for the browser.
# It is highly experimental and may not work as expected. Use at your own risk.

npm run build:browser

browserify dist/browser/tsc/recorder.js -o dist/browser/bundle.js

# Use sed to insert the new string after the line containing the search string
sed -i '' "/exports.BrowserbaseCodeGenerator = BrowserbaseCodeGenerator;/a\\
window.BrowserbaseCodeGenerator = BrowserbaseCodeGenerator;
" dist/browser/bundle.js
