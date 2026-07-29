// ============================================
// PWA-SERVER.JS - Service Worker
// Network First Strategy + Offline Fallback
// ============================================

const CACHE_NAME = 'quick-dukan-v2';
const OFFLINE_URL = '/quick-dukan/offline.html';

// Files to cache on install
const PRE_CACHE_URLS = [
    '/quick-dukan/',
    '/quick-dukan/index.html',
    '/quick-dukan/offline.html',
    '/quick-dukan/css/theme.css',
    '/quick-dukan/css/animations.css',
    '/quick-dukan/css/layout.css',
    '/quick-dukan/css/header.css',
    '/quick-dukan/css/search.css',
    '/quick-dukan/css/categories.css',
    '/quick-dukan/css/product-card.css',
    '/quick-dukan/css/category-products.css',
    '/quick-dukan/css/recently-viewed.css',
    '/quick-dukan/css/most-orders.css',
    '/quick-dukan/css/bottom-nav.css',
    '/quick-dukan/css/dark-mode.css',
    '/quick-dukan/css/orders.css',
    '/quick-dukan/css/checkout.css',
    '/quick-dukan/css/cart.css',
    '/quick-dukan/css/pwa.css',
    '/quick-dukan/css/offline-notification.css',
    '/quick-dukan/manifest.json',
    '/quick-dukan/js/config.js',
    '/quick-dukan/js/whatsapp.js',
    '/quick-dukan/js/theme.js',
    '/quick-dukan/js/language.js',
    '/quick-dukan/js/data-loader.js',
    '/quick-dukan/js/search.js',
    '/quick-dukan/js/categories.js',
    '/quick-dukan/js/products.js',
    '/quick-dukan/js/category-products.js',
    '/quick-dukan/js/recently-viewed.js',
    '/quick-dukan/js/most-orders.js',
    '/quick-dukan/js/cart.js',
    '/quick-dukan/js/bottom-nav.js',
    '/quick-dukan/js/back-to-top.js',
    '/quick-dukan/js/animations.js',
    '/quick-dukan/js/orders.js',
    '/quick-dukan/js/location.js',
    '/quick-dukan/js/checkout.js',
    '/quick-dukan/js/pwa.js',
    '/quick-dukan/js/offline-notification.js',
    '/quick-dukan/js/app.js',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Noto+Sans+Devanagari:wght@400;500;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// ============================================
// INSTALL - Cache essential files
// ============================================
self.addEventListener('install', (event) => {
    console.log('🟢 Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Caching essential files...');
                return cache.addAll(PRE_CACHE_URLS).catch((err) => {
                    console.warn('⚠️ Some files failed to cache:', err);
                });
            })
            .then(() => {
                console.log('✅ Installation complete');
                return self.skipWaiting(); // Activate immediately
            })
    );
});

// ============================================
// ACTIVATE - Clean old caches
// ============================================
self.addEventListener('activate', (event) => {
    console.log('🟢 Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('🗑️ Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
        .then(() => {
            console.log('✅ Activation complete');
            return self.clients.claim(); // Control all clients immediately
        })
    );
});

// ============================================
// FETCH - Network First, Cache Fallback
// ============================================
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    
    // Skip chrome-extension and other non-http requests
    if (!event.request.url.startsWith('http')) return;
    
    event.respondWith(
        // Try network first
        fetch(event.request)
            .then((response) => {
                // Cache the fresh response for future offline use
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Network failed - try cache
                return caches.match(event.request)
                    .then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        // If HTML request, return offline page
                        if (event.request.headers.get('accept')?.includes('text/html')) {
                            return caches.match(OFFLINE_URL);
                        }
                        // Return nothing for other resources
                        return new Response('Offline - Resource not available', {
                            status: 503,
                            headers: { 'Content-Type': 'text/plain' }
                        });
                    });
            })
    );
});

// ============================================
// PUSH NOTIFICATIONS
// ============================================
self.addEventListener('push', (event) => {
    console.log('📨 Push notification received');
    
    let data = {
        title: 'Quick Dukan 🛒',
        body: 'नए ऑफर्स देखें! अभी खरीदारी करें 🎉',
        icon: '/quick-dukan/icons/icon-192.png',
        badge: '/quick-dukan/icons/badge-72.png',
        vibrate: [200, 100, 200],
        tag: 'quick-dukan-offer',
        data: {
            url: '/quick-dukan/'
        }
    };
    
    // If server sent custom data
    if (event.data) {
        try {
            const customData = event.data.json();
            data = { ...data, ...customData };
        } catch (e) {
            data.body = event.data.text();
        }
    }
    
    const options = {
        body: data.body,
        icon: data.icon,
        badge: data.badge,
        vibrate: data.vibrate,
        tag: data.tag,
        data: data.data,
        actions: [
            {
                action: 'open',
                title: 'खोलें 🛒'
            },
            {
                action: 'close',
                title: 'बंद करें ✕'
            }
        ],
        requireInteraction: true,
        renotify: true
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// ============================================
// NOTIFICATION CLICK
// ============================================
self.addEventListener('notificationclick', (event) => {
    console.log('👆 Notification clicked');
    
    event.notification.close();
    
    if (event.action === 'close') return;
    
    const urlToOpen = event.notification.data?.url || '/quick-dukan/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Check if a tab is already open
                for (const client of clientList) {
                    if (client.url.includes(urlToOpen) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new tab
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});

// ============================================
// MESSAGE FROM MAIN THREAD
// ============================================
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data?.type === 'GET_VERSION') {
        const clients = self.clients;
        clients.matchAll().then((clientList) => {
            clientList.forEach((client) => {
                client.postMessage({
                    type: 'VERSION',
                    version: CACHE_NAME
                });
            });
        });
    }
});

console.log('🟢 Service Worker Loaded: ' + CACHE_NAME);