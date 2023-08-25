call node_modules/.bin/rollup -c
call node_modules/.bin/terser --compress --mangle --output codemirror.min.js -- editor.bundle.js
