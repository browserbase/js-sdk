#!/bin/bash

npm run build

browserify dist/recorder/recorder.js -o dist/browser/bundle.js

# Use sed to insert the new string after the line containing the search string
sed -i '' "/exports.BrowserbaseCodeGenerator = BrowserbaseCodeGenerator;/a\\
window.BrowserbaseCodeGenerator = BrowserbaseCodeGenerator;
" dist/browser/bundle.js
