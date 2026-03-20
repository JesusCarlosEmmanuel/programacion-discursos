const CACHE_NAME = 'speaker-scheduler-v6.5';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './css/dashboard.css',
    './css/authorized.css',
    './css/events.css',
    './css/reports.css',
    './css/calendar.css',
    './css/data.css',
    './js/app.js',
    './js/context/state.js',
    './js/utils/phone.js',
    './js/utils/csv.js',
    './js/services/AuthService.js',
    './js/services/FirebaseService.js',
    './js/services/EventService.js',
    './js/services/NotificationService.js',
    './js/components/Dashboard.js',
    './js/components/Authorized.js',
    './js/components/Outgoing.js',
    './js/components/Incoming.js',
    './js/components/Reports.js',
    './js/components/DataManagement.js',
    './js/components/Masters.js',
    './js/components/Calendar.js',
    './js/components/Login.js'
];

// URLs that should ALWAYS hit the network and never be cached or intercepted
const EXCLUDED_DOMAINS = [
    'www.gstatic.com',
    'firebasestorage.googleapis.com',
    'identitytoolkit.googleapis.com',
    'securetoken.googleapis.com',
    'firebaseapp.com',
    'googleapis.com',
    'google.com'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    // Bypass service worker for Firebase/Google auth domains
    if (EXCLUDED_DOMAINS.some(domain => url.hostname.includes(domain))) {
        return; // Let the browser handle the network request naturally
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return fetch(event.request).then((networkResponse) => {
                // Cache a copy of the new resource if valid
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            });
        })
    );
});
