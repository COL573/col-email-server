const CACHE_NAME = "col-bible-quiz-cache-v2"; // updated version
const urlsToCache = [
  "game.html",
  "questions.json",
  "questions_hard.js",
  "manifest.json",
  "quiz-icon.png",
  "style.css",
  "styles/tailwind.css",
  "game.js",
  "offline-leaderboard.js",
  "audio/correct.mp3",
  "audio/wrong.mp3",
  "fonts/bible-font.woff2",
  "my-requests.html",
  "auth.js",                  // if used for login/logout functionality
  "images/hero-light.jpg",    // offline light theme image
  "images/hero-dark.jpg"      // offline dark theme image
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.error("Caching failed:", err))
  );
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Allow runtime fallback for fonts
  if (
    url.origin.includes("fonts.googleapis.com") ||
    url.origin.includes("fonts.gstatic.com")
  ) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Respond with cached version or fetch from network
  event.respondWith(
    caches.match(event.request).then(response =>
      response ||
      fetch(event.request).then(networkRes =>
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkRes.clone());
          return networkRes;
        })
      ).catch(() => {
        // Fallback offline pages
        if (event.request.destination === "document") {
          if (event.request.url.includes("my-requests.html")) {
            return caches.match("my-requests.html");
          }
          return caches.match("game.html");
        }
      })
    )
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
});
