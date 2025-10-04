const WebApp = require('../src/webapp');

// Create WebApp instance
const webapp = new WebApp();

// Start the app and export for Vercel
webapp.start().then(() => {
    console.log('WebApp started successfully for Vercel');
}).catch((error) => {
    console.error('Error starting WebApp for Vercel:', error);
});

// Export the Express app for Vercel
module.exports = webapp.app;
