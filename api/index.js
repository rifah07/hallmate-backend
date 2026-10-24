// Vercel serverless function. vercel.json sends every request here; the
// bundled Express app (npm run build → dist/app.js) handles it.
module.exports = require('../dist/app.js').default;
