## An example app

- start a basic express server to capture analytics: `node -r esm test/example-app/server.js` and open http://localhost:5000/
- Rebuild bundle.js: `yarn rollup test/example-app/client.js --format=es --plugin=@rollup/plugin-node-resolve --file test/example-app/public/bundle.js`
