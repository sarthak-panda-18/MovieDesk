# MovieDesk - Movie Discovery Web App

MovieDesk is a modern movie discovery web application built using HTML, CSS, and JavaScript. It integrates with The Movie Database (TMDB) API to provide real-time movie information, including trending titles, ratings, genres, and search functionality.

## Features

- Browse trending and popular movies
- Search movies by title
- View movie posters, ratings, and release dates
- Responsive user interface
- Fast and lightweight frontend
- Real-time data from the TMDB API

## Tech Stack

- HTML5
- CSS3
- JavaScript (ES6)
- TMDB API

## Project Structure

```
MovieDesk/
├── app.js
├── config.js
├── index.html
├── styles.css
├── README.md
├── outputs/
└── work/
```

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/MovieDesk.git
```

### 2. Navigate to the project directory

```bash
cd MovieDesk
```

### 3. Get a TMDB API Key

Create a free account at https://www.themoviedb.org/.

Generate an API Key or Read Access Token from:

**Settings → API**

### 4. Configure the project

Open `config.js` and add your TMDB credentials.

```javascript
window.MOVIEDESK_CONFIG = {
  tmdbApiKey: "YOUR_TMDB_API_KEY",
  tmdbBearerToken: "YOUR_TMDB_READ_ACCESS_TOKEN",
  inrPerUsd: 83.75,
};
```

### 5. Run the project

Open `index.html` in your browser or serve the project using a local development server such as Live Server.

## Screenshots

Add screenshots of the application here.

## Future Improvements

- Movie details page
- Favorites / Watchlist
- Pagination
- Genre filtering
- Dark and Light theme
- Trailer support
- Infinite scrolling

## License

This project is intended for educational and personal portfolio purposes.

Movie data is provided by **The Movie Database (TMDB)**. This product uses the TMDB API but is not endorsed or certified by TMDB.

## Live Demo
https://movie-desk-snowy.vercel.app
