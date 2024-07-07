#!/bin/bash

npm run build

browserify dist/recorder/recorder.js -o dist/browser/bundle.js

# Use sed to insert the new string after the line containing the search string
sed -i '' "/exports.BrowserbaseRecorder = BrowserbaseRecorder;/a\\
window.BrowserbaseRecorder = BrowserbaseRecorder;
" dist/browser/bundle.js
