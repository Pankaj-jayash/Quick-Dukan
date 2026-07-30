// ============================================
// SERVICE-WORKER.JS - Auto Refresh & Cache
// ============================================

const CACHE_NAME = 'quick-dukan-v1';
const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes

// Files to cache
const STATIC_CACHE = [
    '/',
    '/index.html',
    '/css/theme.css',
    '/css/animations.css',
    '/css/layout.css',
    '/css/header.css',
    '/css/search.css',
    '/css/categories.css',
    '/css/product-card.css',
    '/css/category-products.css',
    '/css/recently-viewed.css',
    '/css/most-orders.css',
    '/css/bottom-nav.css',
    '/css/cart.css',
    '/css/checkout.css',
    '/css/orders.css',
    '/css/dark-mode.css',
    '/js/config.js',
    '/js/whatsapp.js',
    '/js/theme.js',
    '/js/language.js',
    '/js/data-loader.js',
    '/js/search.js',
    '/js/categories.js',
    '/js/products.js',
    '/js/category-products.js',
    '/js/recently-viewed.js',
    '/js/most-orders.js',
    '/js/cart.js',
    '/js/orders.js',
    '/js/checkout.js',
    '/js/location.js',
    '/js/bottom-nav.js',
    '/js/back-to-top.js',
    '/js/animations.js',
    '/js/app.js',
    '/data/index.json',
];

// Install Service Worker
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker Installed');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Caching files...');
                return cache.addAll(STATIC_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate - Clean old caches
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker Activated');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch - Network First, then Cache
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Cache the fresh response
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(() => {
                // Offline fallback - return cached version
                return caches.match(event.request);
            })
    );
});

// Listen for refresh message
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('🔄 Service Worker Ready - Auto Refresh Active');