const CACHE_NAME = 'quick-dukan-v1';

self.addEventListener('install', function(event) {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll([
                '/Quick-Dukan/',
                '/Quick-Dukan/index.html',
                '/Quick-Dukan/css/theme.css',
                '/Quick-Dukan/css/animations.css',
                '/Quick-Dukan/css/layout.css',
                '/Quick-Dukan/css/header.css',
                '/Quick-Dukan/css/search.css',
                '/Quick-Dukan/css/categories.css',
                '/Quick-Dukan/css/product-card.css',
                '/Quick-Dukan/css/category-products.css',
                '/Quick-Dukan/css/recently-viewed.css',
                '/Quick-Dukan/css/most-orders.css',
                '/Quick-Dukan/css/bottom-nav.css',
                '/Quick-Dukan/css/dark-mode.css',
                '/Quick-Dukan/css/orders.css',
                '/Quick-Dukan/css/checkout.css',
                '/Quick-Dukan/css/cart.css',
                '/Quick-Dukan/css/pwa-install.css',
                '/Quick-Dukan/js/config.js',
                '/Quick-Dukan/js/whatsapp.js',
                '/Quick-Dukan/js/theme.js',
                '/Quick-Dukan/js/language.js',
                '/Quick-Dukan/js/data-loader.js',
                '/Quick-Dukan/js/search.js',
                '/Quick-Dukan/js/categories.js',
                '/Quick-Dukan/js/products.js',
                '/Quick-Dukan/js/category-products.js',
                '/Quick-Dukan/js/recently-viewed.js',
                '/Quick-Dukan/js/most-orders.js',
                '/Quick-Dukan/js/cart.js',
                '/Quick-Dukan/js/bottom-nav.js',
                '/Quick-Dukan/js/back-to-top.js',
                '/Quick-Dukan/js/animations.js',
                '/Quick-Dukan/js/app.js',
                '/Quick-Dukan/js/orders.js',
                '/Quick-Dukan/js/location.js',
                '/Quick-Dukan/js/checkout.js',
                '/Quick-Dukan/js/pwa-register.js',
                '/Quick-Dukan/js/pwa-install.js'
            ]);
        })
    );
});

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

self.addEventListener('fetch', function(event) {
    if (event.request.url.includes('fonts.googleapis.com') || 
        event.request.url.includes('cdnjs.cloudflare.com')) {
        return;
    }
    
    event.respondWith(
        fetch(event.request)
            .then(function(response) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME).then(function(cache) {
                    cache.put(event.request, responseClone);
                });
                return response;
            })
            .catch(function() {
                return caches.match(event.request);
            })
    );
});