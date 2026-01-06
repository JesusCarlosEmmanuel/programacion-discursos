const CACHE_NAME = 'speaker-scheduler-v1';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './css/dashboard.css',
    './css/authorized.css',
    './css/events.css',
    './css/reports.css',
    './css/data.css',
    './js/app.js',
    './js/context/state.js',
    './js/components/Dashboard.js',
    './js/components/Authorized.js',
    './js/components/Outgoing.js',
    './js/components/Incoming.js',
    './js/components/Reports.js',
    './js/components/DataManagement.js',
    'https://unpkg.com/lucide@latest',
    'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
    'https://unpkg.com/tesseract.js@v4.0.1/dist/tesseract.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js'
];

// Install Event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// Activate Event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        })
    );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});
