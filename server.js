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
        Authorization: `Bearer ${process.env.TMDB_BEARER_TOKEN}`,
        Accept: "application/json"
    }
});

app.get("/api/*", async (req, res) => {

    try {

        const endpoint = req.params[0];

        const response = await tmdb.get("/" + endpoint, {
            params: req.query
        });

        res.json(response.data);

    }

    catch (err) {

        console.log(err.response?.data || err.message);

        res.status(err.response?.status || 500).json({
            error: "TMDB Request Failed"
        });

    }

});

app.use(express.static(path.join(__dirname)));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`🚀 Server running on http://localhost:${PORT}`);

});