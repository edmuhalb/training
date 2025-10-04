const WebApp = require('../src/webapp');

// Create WebApp instance
const webapp = new WebApp();

// Export the Express app for Vercel
module.exports = webapp.app;
