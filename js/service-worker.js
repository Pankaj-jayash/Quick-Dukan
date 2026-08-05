// ============================================
// SERVICE-WORKER.JS - PWA Cache & Offline (v2)
// ============================================

const CACHE_NAME = 'quick-dukan-v2';
const DATA_CACHE = 'quick-dukan-data-v2';

// Static files to cache (GitHub Pages paths)
const STATIC_CACHE = [
    '/Quick-Dukan/',
    '/Quick-Dukan/index.html',
    '/Quick-Dukan/manifest.json',
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
    '/Quick-Dukan/css/cart.css',
    '/Quick-Dukan/css/checkout.css',
    '/Quick-Dukan/css/orders.css',
    '/Quick-Dukan/css/dark-mode.css',
    '/Quick-Dukan/css/pwa-install.css',
    '/Quick-Dukan/css/splash-screen.css',
    '/Quick-Dukan/css/pull-to-refresh.css',
    '/Quick-Dukan/css/barcode-scanner.css',
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
    '/Quick-Dukan/js/orders.js',
    '/Quick-Dukan/js/checkout.js',
    '/Quick-Dukan/js/location.js',
    '/Quick-Dukan/js/bottom-nav.js',
    '/Quick-Dukan/js/back-to-top.js',
    '/Quick-Dukan/js/animations.js',
    '/Quick-Dukan/js/app.js',
    '/Quick-Dukan/js/auto-refresh.js',
    '/Quick-Dukan/js/pwa-install.js',
    '/Quick-Dukan/js/pull-to-refresh.js',
    '/Quick-Dukan/js/barcode-scanner.js',
    '/Quick-Dukan/icons/icon-72.png',
    '/Quick-Dukan/icons/icon-96.png',
    '/Quick-Dukan/icons/icon-128.png',
    '/Quick-Dukan/icons/icon-144.png',
    '/Quick-Dukan/icons/icon-152.png',
    '/Quick-Dukan/icons/icon-192.png',
    '/Quick-Dukan/icons/icon-384.png',
    '/Quick-Dukan/icons/icon-512.png',
];

// Install
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker v2 Installed');
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('📦 Caching', STATIC_CACHE.length, 'files...');
            return Promise.allSettled(
                STATIC_CACHE.map(url =>
                    cache.add(url).catch(err => {
                        console.warn('Failed to cache:', url, err);
                    })
                )
            );
        })
        .then(() => self.skipWaiting())
    );
});

// Activate - Clean old caches
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker v2 Activated');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                .filter(cache => cache !== CACHE_NAME && cache !== DATA_CACHE)
                .map(cache => {
                    console.log('🗑️ Deleting old cache:', cache);
                    return caches.delete(cache);
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch - Cache First for static, Network First for data
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    if (request.method !== 'GET') return;
    if (url.protocol === 'chrome-extension:') return;
    
    // Data files - Network First
    if (url.pathname.includes('/data/')) {
        event.respondWith(
            fetch(request)
            .then(response => {
                const clone = response.clone();
                caches.open(DATA_CACHE).then(cache => cache.put(request, clone));
                return response;
            })
            .catch(() => caches.match(request))
        );
        return;
    }
    
    // Static assets - Cache First with background update
    event.respondWith(
        caches.match(request).then(cached => {
            const fetchPromise = fetch(request)
                .then(response => {
                    if (response && response.status === 200) {
                        caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
                    }
                    return response;
                })
                .catch(() => null);
            
            return cached || fetchPromise;
        })
    );
});

// Message listener
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('🔄 Service Worker v2 Ready');