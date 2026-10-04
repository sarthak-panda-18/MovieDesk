const config = window.MOVIEDESK_CONFIG || {};
const TMDB = "/api";
const IMAGE = "https://image.tmdb.org/t/p/";
const INRRATE = Number(config.inrPerUsd) || 83.75;
const requestCache = new Map();

const genreMap = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const fallbackMovies = [
  {
    tmdbId: 693134,
    title: "Dune: Part Two",
    year: "2024",
    releaseDate: "2024-02-27",
    poster: "https://image.tmdb.org/t/p/w780/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
    rating: 8.1,
    popularity: 328,
    genreIds: [878, 12],
    genres: ["Sci-Fi", "Adventure"],
    overview: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
    tagline: "Long live the fighters.",
    director: "Denis Villeneuve",
    cast: "Timothée Chalamet, Zendaya, Rebecca Ferguson",
    budget: 190000000,
    revenue: 714444358,
    trailerKey: "Way9Dexny3w",
  },
  {
    tmdbId: 872585,
    title: "Oppenheimer",
    year: "2023",
    releaseDate: "2023-07-19",
    poster: "https://image.tmdb.org/t/p/w780/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
    rating: 8.1,
    popularity: 60,
    genreIds: [18, 36],
    genres: ["Drama", "History"],
    overview: "The story of J. Robert Oppenheimer and his role in the development of the atomic bomb.",
    tagline: "The world forever changes.",
    director: "Christopher Nolan",
    cast: "Cillian Murphy, Emily Blunt, Matt Damon",
    budget: 100000000,
    revenue: 957000000,
    trailerKey: "uYPbbksJxIg",
  },
  {
    tmdbId: 533535,
    title: "Deadpool & Wolverine",
    year: "2024",
    releaseDate: "2024-07-24",
    poster: "https://image.tmdb.org/t/p/w780/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/yDHYTfA3R0jFYba16jBB1jv8uaC.jpg",
    rating: 7.7,
    popularity: 295,
    genreIds: [28, 35, 878],
    genres: ["Action", "Comedy", "Sci-Fi"],
    overview: "A listless Wade Wilson toils in civilian life until a threat to his home universe compels him to suit up again alongside a reluctant Wolverine.",
    tagline: "Come together.",
    director: "Shawn Levy",
    cast: "Ryan Reynolds, Hugh Jackman, Emma Corrin",
    budget: 200000000,
    revenue: 1338000000,
    trailerKey: "73_1biulkYk",
  },
  {
    tmdbId: 1022789,
    title: "Inside Out 2",
    year: "2024",
    releaseDate: "2024-06-11",
    poster: "https://image.tmdb.org/t/p/w780/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/stKGOm8wqGvQEjUtL26L9v0X8QA.jpg",
    rating: 7.6,
    popularity: 220,
    genreIds: [16, 10751, 12, 35],
    genres: ["Animation", "Family", "Adventure"],
    overview: "Teenager Riley's mind headquarters is undergoing a sudden demolition to make room for unexpected new Emotions: Anxiety, Envy, Ennui, and Embarrassment.",
    tagline: "Make room for new emotions.",
    director: "Kelsey Mann",
    cast: "Amy Poehler, Maya Hawke, Kensington Tallman",
    budget: 200000000,
    revenue: 1698000000,
    trailerKey: "LEjhY15eCx0",
  },
  {
    tmdbId: 573435,
    title: "Bad Boys: Ride or Die",
    year: "2024",
    releaseDate: "2024-06-05",
    poster: "https://image.tmdb.org/t/p/w780/nP6RliHjxsz4irTKsxe8FRhKZYl.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/ga4OLm4qLxOqR1dqKbgp99M72s5.jpg",
    rating: 7.5,
    popularity: 180,
    genreIds: [28, 35, 80],
    genres: ["Action", "Comedy", "Crime"],
    overview: "Miami's favorite Bad Boys are back with their iconic mix of edge-of-your-seat action and outrageous comedy, but this time they're on the run.",
    tagline: "Miami's finest are now Miami's most wanted.",
    director: "Adil El Arbi, Bilall Fallah",
    cast: "Will Smith, Martin Lawrence, Vanessa Hudgens",
    budget: 100000000,
    revenue: 404000000,
    trailerKey: "hRFY_Fesa9Q",
  }
];

let popularMovies = fallbackMovies;
let masterMovieList = fallbackMovies;
let shownMovies = fallbackMovies;
let featuredIndex = 0;
let activeMovie = null;
let searchTimer = null;
let heroTimer = null;
let currentGenre = "all";
let currentSort = "popularity";

const $ = (selector) => document.querySelector(selector);
const grid = $("#movieGrid");
const modal = $("#movieModal");
const surpriseModal = $("#surpriseModal");
const searchInput = $("#searchInput");
const searchResults = $("#searchResults");
const cursorAura = $("#cursorAura");

/* Helpers */
function image(path, size = "w780") {
  return path ? (path.startsWith("http") ? path : `${IMAGE}${size}${path}`) : "";
}

function clean(value = "") {
  return String(value).replace(
    /[&<>'"]/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char],
  );
}

function money(value, currency) {
  if (!value || isNaN(value)) return "Not disclosed";
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function movieKey(movie) {
  return String(movie.tmdbId || `${movie.title}-${movie.year}`);
}

function titleForCollection(name = "") {
  return name.replace(/\s+Collection$/i, "");
}

function genresFor(movie) {
  return (movie.genres || movie.genreIds || [])
    .slice(0, 2)
    .map((item) => (typeof item === "string" ? item : genreMap[item] || "Cinema"));
}

/* TMDB Trailer Selector Algorithm */
function findOriginalTrailer(videos = []) {
  if (!Array.isArray(videos) || videos.length === 0) return null;
  const yt = videos.filter((v) => v.site === "YouTube");
  if (!yt.length) return null;

  // 1. Official Trailer with Trailer in name
  const officialTitleTrailer = yt.find(
    (v) => v.type === "Trailer" && v.official && /official.*trailer|main.*trailer|final.*trailer|trailer\s*\d*/i.test(v.name)
  );
  if (officialTitleTrailer) return officialTitleTrailer.key;

  // 2. Any official trailer
  const anyOfficialTrailer = yt.find((v) => v.type === "Trailer" && v.official);
  if (anyOfficialTrailer) return anyOfficialTrailer.key;

  // 3. Any trailer matching "trailer" in title
  const trailerNamed = yt.find((v) => v.type === "Trailer" && /trailer/i.test(v.name));
  if (trailerNamed) return trailerNamed.key;

  // 4. Any Trailer
  const anyTrailer = yt.find((v) => v.type === "Trailer");
  if (anyTrailer) return anyTrailer.key;

  // 5. Official Teaser
  const officialTeaser = yt.find((v) => v.type === "Teaser" && v.official);
  if (officialTeaser) return officialTeaser.key;

  // 6. Any Teaser or Clip
  const anyClip = yt.find((v) => v.type === "Teaser" || v.type === "Clip");
  if (anyClip) return anyClip.key;

  return yt[0].key;
}

/* Dynamic YouTube Trailer Discovery (handles upcoming/indie films like Dude 2025) */
async function getOrFetchTrailerKey(movie) {
  if (movie.trailerKey) return movie.trailerKey;

  try {
    const url = new URL("/api/trailer-search", window.location.origin);
    url.searchParams.set("title", movie.title);
    if (movie.year) url.searchParams.set("year", movie.year);
    if (movie.cast) url.searchParams.set("cast", movie.cast);
    if (movie.director) url.searchParams.set("director", movie.director);

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.key) {
        movie.trailerKey = data.key;
        return data.key;
      }
    }
  } catch (err) {
    console.warn("Could not discover dynamic trailer:", err.message);
  }

  return null;
}

function normalize(data) {
  const trailerKey = findOriginalTrailer(data.videos?.results) || data.trailerKey || null;

  return {
    tmdbId: data.id || data.tmdbId,
    title: data.title || data.name || "Untitled",
    year: (data.release_date || data.first_air_date || data.year || "").slice(0, 4) || "TBA",
    releaseDate: data.release_date || data.releaseDate || "",
    poster: image(data.poster_path || data.poster),
    backdrop: image(data.backdrop_path || data.backdrop, "original"),
    rating: Number(data.vote_average ?? data.rating ?? 0),
    popularity: Math.round(data.popularity ?? 0),
    genreIds: data.genre_ids || data.genreIds || [],
    genres: (data.genres || []).map((g) => (typeof g === "string" ? g : g.name)),
    overview: data.overview || "",
    tagline: data.tagline || "",
    director:
      data.credits?.crew?.find((person) => person.job === "Director")?.name ||
      data.director ||
      "Not listed",
    cast:
      data.credits?.cast
        ?.slice(0, 3)
        .map((person) => person.name)
        .join(", ") ||
      data.cast ||
      "Not listed",
    budget: data.budget || null,
    revenue: data.revenue || null,
    collection: data.belongs_to_collection || data.collection || null,
    trailerKey: trailerKey,
  };
}

async function tmdb(path, params = {}) {
  const url = new URL(`${TMDB}${path}`, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  const key = url.toString();
  if (requestCache.has(key)) {
    return requestCache.get(key);
  }
  const request = fetch(url).then((response) => {
    if (!response.ok) {
      throw new Error(`API ${response.status}`);
    }
    return response.json();
  });
  requestCache.set(key, request);
  try {
    return await request;
  } catch (err) {
    requestCache.delete(key);
    throw err;
  }
}

function toast(message) {
  const item = $("#toast");
  if (!item) return;
  item.textContent = message;
  item.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => item.classList.remove("show"), 2800);
}

/* Ambient Cursor Aura */
if (cursorAura) {
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let auraX = mouseX;
  let auraY = mouseY;

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function updateAura() {
    auraX += (mouseX - auraX) * 0.12;
    auraY += (mouseY - auraY) * 0.12;
    cursorAura.style.transform = `translate3d(${auraX}px, ${auraY}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(updateAura);
  }
  updateAura();
}

/* Header Scroll Glass Effect */
window.addEventListener("scroll", () => {
  const header = $(".site-header");
  if (!header) return;
  if (window.scrollY > 40) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});

/* Movie Card Markup & 3D Tilt */
function posterMarkup(movie, className = "") {
  return movie.poster
    ? `<img class="${className}" src="${movie.poster}" alt="${clean(movie.title)}" loading="lazy" decoding="async" />`
    : `<div class="${className} poster-fallback" aria-hidden="true"></div>`;
}

function saved(movie) {
  return getWatchlist().some((item) => movieKey(item) === movieKey(movie));
}

function cardMarkup(movie, index) {
  const genres = genresFor(movie);
  return `
    <article class="movie-card" data-index="${index}">
      <div class="card-glare"></div>
      <button class="bookmark ${saved(movie) ? "is-saved" : ""}" data-bookmark="${index}" aria-label="${saved(movie) ? "Remove from" : "Add to"} watchlist">
        ${saved(movie) ? "★" : "♡"}
      </button>
      <button class="card-play-trailer" data-card-trailer="${index}" aria-label="Watch original trailer for ${clean(movie.title)}" title="Watch Official Trailer">
        ▶ Trailer
      </button>
      <div class="poster-wrap">
        ${posterMarkup(movie)}
        <span class="rating-badge">${movie.rating ? movie.rating.toFixed(1) : "N/A"}</span>
      </div>
      <div class="card-info">
        <h3>${clean(movie.title)}</h3>
        <div class="card-meta">
          <span>${clean(movie.year)}</span>
          <span aria-hidden="true">/</span>
          <span>${movie.popularity ? `${movie.popularity} popular` : "New release"}</span>
        </div>
        <div class="genre-chips">
          ${genres.map((genre) => `<span class="genre-chip">${clean(genre)}</span>`).join("")}
        </div>
      </div>
    </article>
  `;
}

function attach3DTilt() {
  document.querySelectorAll(".movie-card").forEach((card) => {
    let bounds;

    card.addEventListener("mouseenter", () => {
      bounds = card.getBoundingClientRect();
    });

    card.addEventListener("mousemove", (e) => {
      if (!bounds) bounds = card.getBoundingClientRect();
      const mouseX = e.clientX - bounds.left;
      const mouseY = e.clientY - bounds.top;
      const leftX = mouseX - bounds.width / 2;
      const topY = mouseY - bounds.height / 2;
      const rX = -(topY / (bounds.height / 2)) * 9;
      const rY = (leftX / (bounds.width / 2)) * 9;

      card.style.transform = `perspective(800px) rotateX(${rX.toFixed(2)}deg) rotateY(${rY.toFixed(2)}deg) scale3d(1.03, 1.03, 1.03)`;

      const glare = card.querySelector(".card-glare");
      if (glare) {
        glare.style.setProperty("--glare-x", `${((mouseX / bounds.width) * 100).toFixed(1)}%`);
        glare.style.setProperty("--glare-y", `${((mouseY / bounds.height) * 100).toFixed(1)}%`);
      }
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    });
  });
}

function renderMovies(list) {
  shownMovies = list;
  grid.innerHTML = list.length ? list.map(cardMarkup).join("") : "";
  const emptyState = $("#movieEmpty");
  if (emptyState) emptyState.hidden = Boolean(list.length);
  attach3DTilt();
}

function renderMovieSkeletons() {
  grid.innerHTML = Array.from(
    { length: 8 },
    () => '<div class="card-skeleton"></div>',
  ).join("");
}

/* Filtering & Sorting */
function filterAndSortMovies() {
  let list = [...masterMovieList];

  if (currentGenre !== "all") {
    const genreId = Number(currentGenre);
    list = list.filter((m) =>
      (m.genreIds || []).includes(genreId) ||
      (m.genres || []).some((g) => g.toLowerCase() === genreMap[genreId]?.toLowerCase())
    );
  }

  if (currentSort === "rating") {
    list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (currentSort === "release_date") {
    list.sort((a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0));
  } else {
    list.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }

  renderMovies(list);
}

/* Hero Carousel & Segmented Progress Bar */
function renderHeroSegments() {
  const container = $("#heroSegments");
  if (!container) return;
  const items = popularMovies.slice(0, 5);
  container.innerHTML = items
    .map(
      (movie, i) => `
      <button class="hero-segment-item ${i === featuredIndex ? "active" : ""}" data-hero-segment="${i}" role="tab" aria-selected="${i === featuredIndex}" aria-label="Go to ${clean(movie.title)}">
        <div class="hero-segment-label">
          <span>0${i + 1}</span>
          <strong>${clean(movie.title)}</strong>
        </div>
        <div class="hero-segment-track">
          <div class="hero-segment-fill" id="segmentFill${i}"></div>
        </div>
      </button>
    `,
    )
    .join("");

  container.querySelectorAll("[data-hero-segment]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.heroSegment);
      updateHero(popularMovies[idx], idx);
      startHeroCycle();
    });
  });
}

function resetHeroProgress() {
  const total = Math.min(popularMovies.length, 5);
  for (let i = 0; i < total; i++) {
    const fill = $(`#segmentFill${i}`);
    if (!fill) continue;
    fill.style.transition = "none";
    if (i < featuredIndex) {
      fill.style.width = "100%";
    } else if (i > featuredIndex) {
      fill.style.width = "0%";
    } else {
      fill.style.width = "0%";
      void fill.offsetWidth;
      fill.style.transition = "width 6.5s linear";
      fill.style.width = "100%";
    }
  }

  const container = $("#heroSegments");
  if (container) {
    container.querySelectorAll(".hero-segment-item").forEach((item, idx) => {
      if (idx === featuredIndex) {
        item.classList.add("active");
        item.setAttribute("aria-selected", "true");
      } else {
        item.classList.remove("active");
        item.setAttribute("aria-selected", "false");
      }
    });
  }
}

function updateHero(movie, index = featuredIndex) {
  if (!movie) return;
  featuredIndex = index;
  const backdrop = $("#heroBackdrop");
  const heroContent = $("#heroContent");

  heroContent.classList.remove("hero-swap");
  void heroContent.offsetWidth;
  heroContent.classList.add("hero-swap");

  backdrop.style.backgroundImage = movie.backdrop
    ? `url("${movie.backdrop}")`
    : "radial-gradient(circle at 68% 30%, #5141aa, transparent 40%),linear-gradient(135deg,#151a35,#070914)";

  $("#heroMeta").textContent = `${movie.year}  /  ${genresFor(movie).join("  /  ")}`;
  $("#heroTitle").innerHTML = `${clean(movie.title).replace(":", ":<br>")}<br><em>${clean(movie.tagline || "Made for the big screen.")}</em>`;
  $("#heroCopy").textContent = movie.overview || "A story waiting for your next great watch.";
  $("#heroDetails").dataset.movieId = movie.tmdbId;

  const currentSlideEl = $("#heroCurrentSlide");
  const totalSlidesEl = $("#heroTotalSlides");
  const slideTitleEl = $("#heroSlideTitle");
  if (currentSlideEl) currentSlideEl.textContent = String(featuredIndex + 1).padStart(2, "0");
  if (totalSlidesEl) totalSlidesEl.textContent = String(Math.min(popularMovies.length, 5)).padStart(2, "0");
  if (slideTitleEl) slideTitleEl.textContent = movie.title;

  resetHeroProgress();
}

function startHeroCycle() {
  clearInterval(heroTimer);
  renderHeroSegments();
  resetHeroProgress();
  heroTimer = setInterval(() => {
    featuredIndex = (featuredIndex + 1) % Math.min(popularMovies.length, 5);
    updateHero(popularMovies[featuredIndex], featuredIndex);
  }, 6500);
}

/* Pre-fetch official trailers for top movies */
async function preloadTrailers(movies) {
  for (const movie of movies.slice(0, 8)) {
    if (movie.trailerKey || !movie.tmdbId) continue;
    tmdb(`/movie/${movie.tmdbId}`, { append_to_response: "videos", language: "en-US" })
      .then((data) => {
        const key = findOriginalTrailer(data.videos?.results);
        if (key) {
          movie.trailerKey = key;
        }
      })
      .catch(() => {});
  }
}

/* Watchlist Management */
function getWatchlist() {
  try {
    return (
      JSON.parse(localStorage.getItem("moviedesk-watchlist-v2")) ||
      JSON.parse(localStorage.getItem("moviesdesk-watchlist-v1")) ||
      []
    );
  } catch {
    return [];
  }
}

function setWatchlist(list) {
  localStorage.setItem("moviedesk-watchlist-v2", JSON.stringify(list));
}

function renderWatchlist() {
  const list = getWatchlist();
  const host = $("#watchlistItems");
  const empty = $("#watchlistEmpty");
  if (empty) empty.hidden = list.length > 0;
  if (host) {
    host.innerHTML = list
      .map(
        (movie, index) =>
          `<article class="watchlist-card">${posterMarkup(movie)}<div><strong>${clean(movie.title)}</strong><small>${clean(movie.year)} / ${genresFor(movie).join(", ")}</small></div><button class="remove-watchlist" data-remove="${index}" aria-label="Remove ${clean(movie.title)}">&#215;</button></article>`,
      )
      .join("");
  }
  const clearBtn = $("#clearWatchlist");
  const countBadge = $("#watchlistCount");
  if (clearBtn) clearBtn.hidden = !list.length;
  if (countBadge) {
    countBadge.hidden = !list.length;
    countBadge.textContent = list.length;
  }
}

function toggleWatchlist(movie, triggerElement) {
  const list = getWatchlist();
  const index = list.findIndex((item) => movieKey(item) === movieKey(movie));
  if (index >= 0) {
    list.splice(index, 1);
    toast(`${movie.title} removed from your watchlist`);
  } else {
    list.unshift(movie);
    toast(`★ ${movie.title} saved to your watchlist`);
    if (triggerElement) {
      triggerElement.classList.add("bookmark-pop");
      setTimeout(() => triggerElement.classList.remove("bookmark-pop"), 500);
    }
  }
  setWatchlist(list);
  renderWatchlist();
  renderMovies(shownMovies);
}

/* Play Trailer in Theater Mode with Guaranteed Dynamic Fallback */
async function startTrailerPlayback(movie) {
  const trailerSection = $("#modalTrailerSection");
  const trailerIframe = $("#modalTrailerIframe");
  const trailerTitle = $("#trailerTitle");
  const trailerExternalLink = $("#trailerExternalLink");

  if (trailerTitle) trailerTitle.textContent = `Finding Official Trailer for "${movie.title}"...`;
  if (trailerSection) {
    trailerSection.hidden = false;
    trailerSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  const key = await getOrFetchTrailerKey(movie);

  if (key) {
    if (trailerTitle) trailerTitle.textContent = `Official Trailer — ${movie.title}`;
    if (trailerExternalLink) {
      trailerExternalLink.href = `https://www.youtube.com/watch?v=${key}`;
      trailerExternalLink.hidden = false;
    }
    if (trailerIframe) {
      trailerIframe.src = `https://www.youtube.com/embed/${key}?autoplay=1&rel=0&enablejsapi=1`;
    }
  } else {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + " " + (movie.year || "") + " official trailer")}`;
    if (trailerTitle) trailerTitle.textContent = `Watch "${movie.title}" Trailer on YouTube`;
    if (trailerExternalLink) {
      trailerExternalLink.href = searchUrl;
      trailerExternalLink.hidden = false;
    }
    toast(`Opening YouTube trailer for ${movie.title}`);
    window.open(searchUrl, "_blank", "noopener,noreferrer");
  }
}

function stopTrailerPlayback() {
  const trailerSection = $("#modalTrailerSection");
  const trailerIframe = $("#modalTrailerIframe");
  if (trailerSection) trailerSection.hidden = true;
  if (trailerIframe) trailerIframe.src = "";
}

/* Movie Detail Modal */
function showMovie(movie, autoPlayTrailer = false) {
  activeMovie = movie;
  const backdropEl = $("#modalBackdrop");
  if (backdropEl) {
    backdropEl.style.backgroundImage = movie.backdrop ? `url("${movie.backdrop}")` : "";
  }

  const posterImg = $("#modalPosterImg");
  if (posterImg) {
    posterImg.src = movie.poster || "";
    posterImg.alt = movie.title || "Movie Poster";
  }

  const ratingScore = $("#modalRatingScore");
  if (ratingScore) ratingScore.textContent = movie.rating ? movie.rating.toFixed(1) : "N/A";

  const yearEl = $("#modalYear");
  if (yearEl) yearEl.textContent = movie.year || "2026";

  const metaEl = $("#modalMeta");
  if (metaEl) metaEl.textContent = genresFor(movie).join(" / ") || "Cinema";

  const voteCountEl = $("#modalVoteCount");
  if (voteCountEl) {
    voteCountEl.textContent = movie.popularity ? `${movie.popularity} Popularity Score` : "Audience Pick";
  }

  $("#modalTitle").textContent = movie.title;
  $("#modalTagline").textContent = movie.tagline || "";
  $("#modalOverview").textContent = movie.overview || "No synopsis is available for this title yet.";
  $("#modalDirector").textContent = movie.director || "Not listed";
  $("#modalCast").textContent = movie.cast || "Not listed";
  $("#modalReleaseDate").textContent = movie.releaseDate
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(movie.releaseDate))
    : "Not listed";
  $("#modalRating").textContent = movie.rating ? `${movie.rating.toFixed(1)} / 10` : "Not rated";
  $("#modalBudgetUsd").textContent = money(movie.budget, "USD");
  $("#modalRevenueUsd").textContent = money(movie.revenue, "USD");
  $("#modalBudgetInr").textContent = money(movie.budget ? movie.budget * INRRATE : null, "INR");
  $("#modalRevenueInr").textContent = money(movie.revenue ? movie.revenue * INRRATE : null, "INR");
  $("#exchangeRate").textContent = `1 USD = INR ${INRRATE.toFixed(2)} estimate`;

  const watchlistBtn = $("#watchlistButton");
  if (watchlistBtn) {
    watchlistBtn.textContent = saved(movie) ? "Remove from watchlist" : "Bookmark to watchlist";
  }

  // Setup Watch Trailer button
  const trailerBtn = $("#modalWatchTrailerBtn");
  if (trailerBtn) {
    trailerBtn.onclick = () => startTrailerPlayback(activeMovie || movie);
  }

  // Setup Share Movie button
  const shareBtn = $("#modalShareBtn");
  if (shareBtn) {
    shareBtn.onclick = async () => {
      const shareText = `Check out "${movie.title}" (${movie.year}) on MovieDesk!`;
      if (navigator.share) {
        try {
          await navigator.share({
            title: `MovieDesk | ${movie.title}`,
            text: shareText,
            url: window.location.href,
          });
          toast(`Shared ${movie.title}!`);
        } catch {
          // Cancelled by user
        }
      } else {
        try {
          await navigator.clipboard.writeText(`${shareText} - ${window.location.href}`);
          toast(`Copied ${movie.title} details to clipboard!`);
        } catch {
          toast(`Link ready to share!`);
        }
      }
    };
  }

  // Background trailer discovery if not yet cached
  if (!movie.trailerKey) {
    getOrFetchTrailerKey(movie).then((key) => {
      if (key && activeMovie && movieKey(activeMovie) === movieKey(movie)) {
        activeMovie.trailerKey = key;
      }
    });
  }

  if (autoPlayTrailer) {
    startTrailerPlayback(movie);
  } else {
    stopTrailerPlayback();
  }

  modal.showModal();
}

async function showDetails(movie, autoPlayTrailer = false) {
  try {
    if (movie.tmdbId) {
      const data = await tmdb(`/movie/${movie.tmdbId}`, {
        append_to_response: "credits,videos",
        language: "en-US",
      });
      const normalized = normalize(data);
      // Preserve any already cached trailerKey
      if (movie.trailerKey && !normalized.trailerKey) {
        normalized.trailerKey = movie.trailerKey;
      }
      showMovie(normalized, autoPlayTrailer);
      return;
    }
    showMovie(movie, autoPlayTrailer);
  } catch {
    showMovie(movie, autoPlayTrailer);
  }
}

/* Trailer Player Controls */
$("#closeTrailerBtn")?.addEventListener("click", stopTrailerPlayback);

/* Search Suggestions & Submit */
function clearSuggestions() {
  searchResults.hidden = true;
  searchResults.innerHTML = "";
  searchInput.setAttribute("aria-expanded", "false");
}

function suggestionMarkup(movie, index) {
  return `<button class="search-result" data-suggestion="${index}" role="option">${posterMarkup(movie)}<span><strong>${clean(movie.title)}</strong><small>${clean(movie.year)} / ${genresFor(movie).join(", ")}</small></span><b>${movie.rating ? movie.rating.toFixed(1) : "New"}</b></button>`;
}

function renderSuggestions(list, message = "") {
  if (!list.length && !message) return clearSuggestions();
  searchResults._movies = list;
  searchResults.innerHTML = message
    ? `<p class="search-status">${message}</p>`
    : list.map(suggestionMarkup).join("");
  searchResults.hidden = false;
  searchInput.setAttribute("aria-expanded", "true");
}

async function suggestions(query) {
  if (query.length < 2) return clearSuggestions();
  renderSuggestions([], '<span class="loading-dot"></span> Searching TMDB...');
  try {
    const data = await tmdb("/search/movie", {
      query,
      include_adult: "false",
      language: "en-US",
    });
    const list = data.results.slice(0, 7).map(normalize);
    renderSuggestions(list, list.length ? "" : "No exact matches. Try another search.");
  } catch {
    const local = fallbackMovies.filter((movie) =>
      movie.title.toLowerCase().includes(query.toLowerCase()),
    );
    renderSuggestions(local, local.length ? "" : "Search is unavailable right now.");
  }
}

async function submitSearch(query) {
  clearSuggestions();
  if (!query) {
    masterMovieList = popularMovies;
    filterAndSortMovies();
    return;
  }
  renderMovieSkeletons();
  try {
    const data = await tmdb("/search/movie", {
      query,
      include_adult: "false",
      language: "en-US",
    });
    masterMovieList = data.results.map(normalize);
    filterAndSortMovies();
    preloadTrailers(masterMovieList);
  } catch {
    masterMovieList = fallbackMovies.filter((movie) =>
      movie.title.toLowerCase().includes(query.toLowerCase()),
    );
    filterAndSortMovies();
  }
}

/* Collections Rail */
function collectionMarkup(collection) {
  const art = collection.poster
    ? `<img src="${collection.poster}" alt="${clean(collection.name)}" loading="lazy" decoding="async"/>`
    : '<div class="collection-placeholder"></div>';
  return `<article class="collection-card" data-collection="${collection.id}">${art}<div class="collection-info"><span>${collection.parts.length} films</span><h3>${clean(titleForCollection(collection.name))}</h3></div></article>`;
}

function collectionSkeletons() {
  return Array.from({ length: 5 }, () => '<div class="collection-skeleton"></div>').join("");
}

async function loadCollections() {
  const rail = $("#collectionRail");
  if (!rail) return;
  rail.innerHTML = collectionSkeletons();
  try {
    const source = await tmdb("/movie/popular", { language: "en-US", page: "1" });
    const curated = [10, 86311, 295, 328, 119, 8091, 131292];
    const ids = [
      ...new Set([
        ...source.results.map((movie) => movie.belongs_to_collection?.id).filter(Boolean),
        ...curated,
      ]),
    ].slice(0, 7);
    const complete = await Promise.all(
      ids.map((id) => tmdb(`/collection/${id}`, { language: "en-US" })),
    );
    const collections = complete
      .map((data) => ({
        id: data.id,
        name: data.name,
        poster: image(data.poster_path),
        parts: data.parts || [],
      }))
      .filter((item) => item.parts.length);
    rail.innerHTML = collections.length
      ? collections.map(collectionMarkup).join("")
      : '<p class="search-status">Collections are not available right now.</p>';
  } catch {
    rail.innerHTML = '<p class="search-status">Collections could not be loaded.</p>';
  }
}

async function openCollection(id) {
  try {
    const data = await tmdb(`/collection/${id}`, { language: "en-US" });
    masterMovieList = data.parts.map(normalize);
    filterAndSortMovies();
    preloadTrailers(masterMovieList);
    $("#discover")?.scrollIntoView({ behavior: "smooth", block: "start" });
    toast(`🎬 ${data.name} loaded`);
  } catch {
    toast("That collection could not be opened.");
  }
}

/* Surprise Me Reel Animation */
function triggerSurpriseMe() {
  const reel = $("#surpriseReel");
  const candidates = [...popularMovies, ...fallbackMovies];
  const shuffled = candidates.sort(() => Math.random() - 0.5);
  const chosen = shuffled[0];

  reel.innerHTML = shuffled
    .slice(0, 8)
    .map(
      (m) =>
        `<div class="surprise-item">${posterMarkup(m)}<strong>${clean(m.title)}</strong><small>${clean(m.year)}</small></div>`,
    )
    .join("");

  reel.style.transition = "none";
  reel.style.transform = "translateY(0px)";
  surpriseModal.showModal();

  setTimeout(() => {
    reel.style.transition = "transform 1.6s cubic-bezier(0.12, 0.8, 0.32, 1)";
    const itemHeight = 220;
    reel.style.transform = `translateY(-${(shuffled.slice(0, 8).length - 1) * itemHeight}px)`;
  }, 50);

  setTimeout(() => {
    surpriseModal.close();
    showDetails(chosen);
    toast(`✨ Found your next watch: ${chosen.title}`);
  }, 1900);
}

/* App Initialization */
async function initialise() {
  renderMovieSkeletons();
  try {
    const data = await tmdb("/movie/popular", {
      language: "en-US",
      region: "IN",
    });
    popularMovies = data.results.slice(0, 16).map(normalize);
    masterMovieList = popularMovies;
    filterAndSortMovies();
    updateHero(popularMovies[0], 0);
    startHeroCycle();
    preloadTrailers(popularMovies);
  } catch {
    popularMovies = fallbackMovies;
    masterMovieList = fallbackMovies;
    filterAndSortMovies();
    updateHero(fallbackMovies[0], 0);
    startHeroCycle();
    toast("Showing selected titles while TMDB loads.");
  }
  renderWatchlist();

  const collectionsSection = $("#collections");
  if (collectionsSection) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          loadCollections();
          observer.disconnect();
        }
      },
      { rootMargin: "260px" },
    );
    observer.observe(collectionsSection);
  }
}

/* Event Listeners */
grid?.addEventListener("click", (event) => {
  const trailerBtn = event.target.closest("[data-card-trailer]");
  if (trailerBtn) {
    event.stopPropagation();
    const movie = shownMovies[Number(trailerBtn.dataset.cardTrailer)];
    showDetails(movie, true);
    return;
  }

  const bookmarkBtn = event.target.closest("[data-bookmark]");
  if (bookmarkBtn) {
    event.stopPropagation();
    const movie = shownMovies[Number(bookmarkBtn.dataset.bookmark)];
    toggleWatchlist(movie, bookmarkBtn);
    return;
  }

  const card = event.target.closest("[data-index]");
  if (!card) return;
  const movie = shownMovies[Number(card.dataset.index)];
  showDetails(movie, false);
});

// Search Form
$("#searchForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  submitSearch(searchInput.value.trim());
  $("#discover")?.scrollIntoView({ behavior: "smooth" });
});

searchInput?.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => suggestions(searchInput.value.trim()), 260);
});

searchInput?.addEventListener("keydown", (event) => {
  if (event.key === "Escape") clearSuggestions();
});

searchResults?.addEventListener("click", (event) => {
  const item = event.target.closest("[data-suggestion]");
  if (!item) return;
  const movie = searchResults._movies[Number(item.dataset.suggestion)];
  searchInput.value = movie.title;
  clearSuggestions();
  showDetails(movie);
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".search-wrap")) clearSuggestions();
});

// Quick Search Tags
document.querySelectorAll("[data-query]").forEach((button) =>
  button.addEventListener("click", () => {
    searchInput.value = button.dataset.query;
    submitSearch(button.dataset.query);
  }),
);

// Genre Filter Bar
$("#genreFilterBar")?.addEventListener("click", (event) => {
  const chip = event.target.closest(".filter-chip");
  if (!chip) return;
  document.querySelectorAll(".filter-chip").forEach((c) => c.classList.remove("active"));
  chip.classList.add("active");
  currentGenre = chip.dataset.genre;
  filterAndSortMovies();
});

// Sort Control
$("#sortSelect")?.addEventListener("change", (e) => {
  currentSort = e.target.value;
  filterAndSortMovies();
});

// Hero Arrow Controls
$("#heroPrevBtn")?.addEventListener("click", () => {
  featuredIndex = (featuredIndex - 1 + Math.min(popularMovies.length, 5)) % Math.min(popularMovies.length, 5);
  updateHero(popularMovies[featuredIndex], featuredIndex);
  startHeroCycle();
});

$("#heroNextBtn")?.addEventListener("click", () => {
  featuredIndex = (featuredIndex + 1) % Math.min(popularMovies.length, 5);
  updateHero(popularMovies[featuredIndex], featuredIndex);
  startHeroCycle();
});

$("#heroDetails")?.addEventListener("click", () =>
  showDetails(
    popularMovies.find(
      (movie) => String(movie.tmdbId) === $("#heroDetails").dataset.movieId,
    ) || popularMovies[0],
    false,
  ),
);

$("#heroTrailerBtn")?.addEventListener("click", () => {
  const movie = popularMovies[featuredIndex] || fallbackMovies[0];
  showDetails(movie, true);
});

// Surprise Me
$("#surpriseButton")?.addEventListener("click", triggerSurpriseMe);

// Modal Close & Watchlist & Backdrop click
$("#closeModal")?.addEventListener("click", () => {
  modal.close();
  stopTrailerPlayback();
});

modal?.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.close();
    stopTrailerPlayback();
  }
});

$("#watchlistButton")?.addEventListener("click", () => {
  if (activeMovie) {
    toggleWatchlist(activeMovie);
    modal.close();
    stopTrailerPlayback();
  }
});

$("#watchlistItems")?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove]");
  if (!button) return;
  const list = getWatchlist();
  const [removed] = list.splice(Number(button.dataset.remove), 1);
  setWatchlist(list);
  renderWatchlist();
  toast(`${removed.title} removed from your watchlist`);
});

$("#clearWatchlist")?.addEventListener("click", () => {
  setWatchlist([]);
  renderWatchlist();
  toast("Watchlist cleared");
});

// Collection Rail Scroll Arrows
$("#collectionPrev")?.addEventListener("click", () => {
  $("#collectionRail")?.scrollBy({ left: -320, behavior: "smooth" });
});

$("#collectionNext")?.addEventListener("click", () => {
  $("#collectionRail")?.scrollBy({ left: 320, behavior: "smooth" });
});

$("#collectionRail")?.addEventListener("click", (event) => {
  const card = event.target.closest("[data-collection]");
  if (card) openCollection(card.dataset.collection);
});

initialise();
