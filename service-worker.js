// ============================================
//  SERVICE WORKER - Network First, Auto Update
//  Quick Dukan - Kirana Store
// ============================================

const CACHE_NAME = 'quick-dukan-v1';

// Install - Skip waiting to activate immediately
self.addEventListener('install', function(event) {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll([
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
                '/css/dark-mode.css',
                '/css/orders.css',
                '/css/checkout.css',
                '/css/cart.css',
                '/css/pwa-install.css',
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
                '/js/bottom-nav.js',
                '/js/back-to-top.js',
                '/js/animations.js',
                '/js/app.js',
                '/js/orders.js',
                '/js/location.js',
                '/js/checkout.js',
                '/js/pwa-register.js',
                '/js/pwa-install.js'
            ]);
        })
    );
});

// Activate - Delete old cache
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch - Network first, then cache
self.addEventListener('fetch', function(event) {
    // Skip Google Fonts & external CDN requests
    if (event.request.url.includes('fonts.googleapis.com') || 
        event.request.url.includes('cdnjs.cloudflare.com')) {
        return;
    }
    
    event.respondWith(
        fetch(event.request)
            .then(function(response) {
                // Update cache with new version
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(function(cache) {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(function() {
                // Offline - serve from cache
                return caches.match(event.request);
            })
    );
});