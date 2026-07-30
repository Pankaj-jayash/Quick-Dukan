// ============================================
// PWA.JS - Splash + Install + Service Worker + Refresh
// ============================================

class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.refreshTimer = null;
        this.isRefreshing = false;
        this.init();
    }

    init() {
        console.log('📱 PWA Manager Initialized');
        this.registerServiceWorker();
        this.showSplashScreen();
        this.setupInstallPrompt();
        this.setupAutoRefresh();
        this.waitAndHideSplash();
    }

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./js/service-worker.js')
                .then(reg => console.log('✅ Service Worker Registered:', reg.scope))
                .catch(err => console.warn('⚠️ SW failed:', err));
        }
    }

    showSplashScreen() {
        if (document.getElementById('appSplash')) return;
        const splash = document.createElement('div');
        splash.id = 'appSplash';
        splash.className = 'splash-screen';
        splash.innerHTML = `<div class="splash-container"><div class="splash-icon">🛒</div><div class="splash-title">Quick Dukan</div><div class="splash-tagline">आपकी विश्वसनीय किराना दुकान</div><div class="splash-dots"><div class="splash-dot"></div><div class="splash-dot"></div><div class="splash-dot"></div></div></div>`;
        document.body.appendChild(splash);
    }

    hideSplashScreen() {
        const splash = document.getElementById('appSplash');
        if (!splash) return;
        splash.style.opacity = '0';
        splash.style.transform = 'scale(1.1)';
        setTimeout(() => { if (splash.parentNode) splash.remove(); }, 500);
    }

    waitAndHideSplash() {
        const check = setInterval(() => {
            if (window.dataLoader?.isLoaded) { clearInterval(check); setTimeout(() => this.hideSplashScreen(), 800); }
        }, 100);
        setTimeout(() => { clearInterval(check); this.hideSplashScreen(); }, 5000);
    }

    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            setTimeout(() => this.showInstallBanner(), 3000);
        });
        window.addEventListener('appinstalled', () => {
            this.deferredPrompt = null;
            localStorage.setItem('pwa-installed', 'true');
            this.showToast('🎉 ऐप इंस्टॉल हो गया!');
        });
    }

    showInstallBanner() {
        if (!this.deferredPrompt || localStorage.getItem('pwa-banner-shown') || localStorage.getItem('pwa-installed')) return;
        const lang = window.languageManager?.currentLang || 'hi';
        const banner = document.createElement('div');
        banner.className = 'install-banner';
        banner.innerHTML = `<div class="install-banner-content"><div class="install-banner-icon">🛒</div><div class="install-banner-text"><strong>${lang==='hi'?'Quick Dukan ऐप इंस्टॉल करें':'Install Quick Dukan'}</strong><span>${lang==='hi'?'होम स्क्रीन पर जोड़ें — तेज़, आसान!':'Add to Home Screen!'}</span></div><button class="install-banner-btn" id="installBtn">${lang==='hi'?'इंस्टॉल करें':'Install'}</button><button class="install-banner-close" id="closeBanner">✕</button></div>`;
        document.body.appendChild(banner);
        document.getElementById('installBtn').addEventListener('click', async () => {
            if (this.deferredPrompt) { this.deferredPrompt.prompt(); const r = await this.deferredPrompt.userChoice; this.deferredPrompt = null; }
            banner.remove();
            localStorage.setItem('pwa-banner-shown', 'true');
        });
        document.getElementById('closeBanner').addEventListener('click', () => { banner.remove(); localStorage.setItem('pwa-banner-shown', 'true'); });
        setTimeout(() => { if (banner.parentNode) banner.remove(); }, 35000);
    }

    setupAutoRefresh() {
        this.refreshTimer = setInterval(() => this.performRefresh(), 30 * 60 * 1000);
        window.addEventListener('online', () => setTimeout(() => this.performRefresh(), 2000));
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                const last = localStorage.getItem('quick-dukan-last-refresh');
                if (!last || (Date.now() - parseInt(last)) > 10 * 60 * 1000) this.performRefresh();
            }
        });
    }

    async performRefresh() {
        if (this.isRefreshing) return;
        this.isRefreshing = true;
        try {
            if (window.dataLoader) { window.dataLoader.allProducts=[]; window.dataLoader.productsByCategory={}; window.dataLoader.isLoaded=false; await window.dataLoader.loadAllData(); }
            if (window.productsManager) window.productsManager.refreshAllProducts();
            if (window.mostOrdersManager) window.mostOrdersManager.checkAndShow();
            if (window.recentlyViewedManager) window.recentlyViewedManager.checkAndShow();
            localStorage.setItem('quick-dukan-last-refresh', Date.now().toString());
        } catch(e) { console.error('Refresh failed:', e); }
        this.isRefreshing = false;
    }

    showToast(m) {
        const t = document.getElementById('toast'); if(!t) return;
        t.textContent = m; t.classList.remove('hidden'); t.style.animation='none'; t.offsetHeight; t.style.animation='slideUp 0.3s ease';
        setTimeout(() => { t.style.animation='fadeOut 0.3s ease forwards'; setTimeout(() => t.classList.add('hidden'), 300); }, 2500);
    }
}

document.addEventListener('DOMContentLoaded', () => { window.pwaManager = new PWAManager(); });
window.forceRefresh = () => { if(window.pwaManager) window.pwaManager.performRefresh(); };