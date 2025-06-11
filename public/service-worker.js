const CACHE_NAME = "col-bible-quiz-cache-v1";
const urlsToCache = [
  "game.html",
  "questions.json",
  "questions_hard.js",     // ✅ Add this
  "manifest.json",
  "quiz-icon.png",
  "style.css",
  "game.js",
  "offline-leaderboard.js", // ✅ If you use an offline leaderboard module
  "audio/correct.mp3",      // ✅ Example: audio files if used
  "audio/wrong.mp3",
  "fonts/bible-font.woff2"  // ✅ Any custom font files
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.error('Caching failed:', err))
  );
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Allow runtime fallback for fonts
  if (url.origin.includes("fonts.googleapis.com") || url.origin.includes("fonts.gstatic.com")) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response =>
      response || fetch(event.request).then(networkRes => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, networkRes.clone());
          return networkRes;
        });
      }).catch(() => caches.match("game.html")) // fallback page
    )
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});
