const CACHE_NAME = 'quick-dukan-v2';
const STATIC_CACHE = ['./','./index.html','./css/theme.css','./css/animations.css','./css/layout.css','./css/header.css','./css/search.css','./css/categories.css','./css/product-card.css','./css/category-products.css','./css/recently-viewed.css','./css/most-orders.css','./css/bottom-nav.css','./css/cart.css','./css/checkout.css','./css/orders.css','./css/dark-mode.css','./css/pwa.css','./js/config.js','./js/whatsapp.js','./js/theme.js','./js/language.js','./js/data-loader.js','./js/search.js','./js/categories.js','./js/products.js','./js/category-products.js','./js/recently-viewed.js','./js/most-orders.js','./js/cart.js','./js/orders.js','./js/checkout.js','./js/location.js','./js/bottom-nav.js','./js/back-to-top.js','./js/animations.js','./js/pwa.js','./js/app.js','./data/index.json','./manifest.json'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(cache => Promise.allSettled(STATIC_CACHE.map(url => cache.add(url).catch(() => {})))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(names => Promise.all(names.map(c => c !== CACHE_NAME ? caches.delete(c) : null))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) return;
    e.respondWith(fetch(e.request).then(res => { if(res.status===200){const clone=res.clone();caches.open(CACHE_NAME).then(c => c.put(e.request, clone));} return res; }).catch(() => caches.match(e.request)));
});