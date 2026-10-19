const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const tmdb = axios.create({
    baseURL: "https://api.themoviedb.org/3",
    headers: {
        Accept: "application/json"
    }
});

// Dynamic header injection for serverless & local environments
tmdb.interceptors.request.use((config) => {
    const token = process.env.TMDB_BEARER_TOKEN;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const trailerCache = new Map();

// Endpoint to find YouTube trailer when TMDB has no trailer linked or for upcoming/regional films
app.get("/api/trailer-search", async (req, res) => {
    const { title, year, cast, director } = req.query;
    if (!title) {
        return res.status(400).json({ error: "Missing title query parameter" });
    }

    const cacheKey = `${title}-${year || ""}-${cast || ""}`.toLowerCase();
    if (trailerCache.has(cacheKey)) {
        return res.json({ key: trailerCache.get(cacheKey) });
    }

    try {
        const queryParts = [title];
        if (year && year !== "TBA") queryParts.push(year);
        if (cast && cast !== "Not listed") queryParts.push(cast.split(",")[0].trim());
        if (director && director !== "Not listed") queryParts.push(director);
        queryParts.push("official trailer");

        const searchQuery = encodeURIComponent(queryParts.join(" "));
        const ytUrl = `https://www.youtube.com/results?search_query=${searchQuery}`;

        const response = await axios.get(ytUrl, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9"
            },
            timeout: 6000
        });

        const reg = /"videoId":"([a-zA-Z0-9_-]{11})"/g;
        const matches = [...response.data.matchAll(reg)].map(m => m[1]);
        const unique = [...new Set(matches)];

        if (unique.length > 0) {
            const key = unique[0];
            trailerCache.set(cacheKey, key);
            return res.json({ key });
        }

        res.json({ key: null });
    } catch (err) {
        console.error("Trailer search error:", err.message);
        res.json({ key: null });
    }
});

// TMDB API Proxy
app.get("/api/*", async (req, res) => {
    if (!process.env.TMDB_BEARER_TOKEN) {
        console.error("Missing TMDB_BEARER_TOKEN in environment variables");
        return res.status(500).json({
            error: "TMDB_BEARER_TOKEN is not configured in environment variables."
        });
    }

    try {
        const endpoint = req.params[0];
        const response = await tmdb.get("/" + endpoint, {
            params: req.query
        });
        res.json(response.data);
    } catch (err) {
        console.error("TMDB Request Failed:", err.response?.data || err.message);
        res.status(err.response?.status || 500).json({
            error: "TMDB Request Failed",
            details: err.response?.data || err.message
        });
    }
});

app.use(express.static(path.join(__dirname, "frontend")));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Only listen when executed directly, not when imported as a serverless module
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;