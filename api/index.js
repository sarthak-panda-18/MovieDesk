const app = require("../server");

// Vercel Serverless Function entrypoint
module.exports = (req, res) => {
    // Ensure the path retains the /api prefix if rewritten by Vercel
    if (!req.url.startsWith("/api")) {
        req.url = "/api" + req.url;
    }
    return app(req, res);
};
