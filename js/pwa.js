// ============================================
// PWA.JS - Splash Screen + Install + Auto Refresh
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
        
        // Show splash screen immediately
        this.showSplashScreen();
        
        // Setup install prompt
        this.setupInstallPrompt();
        
        // Setup auto refresh
        this.setupAutoRefresh();
        
        // Hide splash after everything loads
        this.waitAndHideSplash();
    }

    // ============================================
    // SPLASH SCREEN
    // ============================================
    showSplashScreen() {
        if (document.getElementById('appSplash')) return;

        const splash = document.createElement('div');
        splash.id = 'appSplash';
        splash.className = 'splash-screen';
        splash.innerHTML = `
            <div class="splash-container">
                <div class="splash-icon">🛒</div>
                <div class="splash-title">Quick Dukan</div>
                <div class="splash-tagline">आपकी विश्वसनीय किराना दुकान</div>
                <div class="splash-dots">
                    <div class="splash-dot"></div>
                    <div class="splash-dot"></div>
                    <div class="splash-dot"></div>
                </div>
            </div>
        `;
        document.body.appendChild(splash);
    }

    hideSplashScreen() {
        const splash = document.getElementById('appSplash');
        if (!splash) return;

        splash.style.opacity = '0';
        splash.style.transform = 'scale(1.1)';

        setTimeout(() => {
            if (splash.parentNode) {
                splash.remove();
            }
        }, 500);
    }

    waitAndHideSplash() {
        // Hide when data is loaded or after timeout
        const checkData = setInterval(() => {
            if (window.dataLoader && window.dataLoader.isLoaded) {
                clearInterval(checkData);
                setTimeout(() => this.hideSplashScreen(), 800);
            }
        }, 100);

        // Fallback: hide after 5 seconds anyway
        setTimeout(() => {
            clearInterval(checkData);
            this.hideSplashScreen();
        }, 5000);
    }

    // ============================================
    // PWA INSTALL PROMPT
    // ============================================
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            console.log('📲 PWA Install Ready');

            // Show banner after 8 seconds
            setTimeout(() => this.showInstallBanner(), 8000);
        });

        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA Installed Successfully!');
            this.deferredPrompt = null;
            localStorage.setItem('pwa-installed', 'true');
            this.showToast('🎉 Quick Dukan ऐप इंस्टॉल हो गया!');
        });

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('📱 Already running as PWA');
        }
    }

    showInstallBanner() {
        // Don't show if not available
        if (!this.deferredPrompt) return;
        
        // Don't show if already shown
        if (localStorage.getItem('pwa-banner-shown')) return;
        
        // Don't show if already installed
        if (localStorage.getItem('pwa-installed')) return;

        const lang = window.languageManager?.currentLang || 'hi';

        const banner = document.createElement('div');
        banner.className = 'install-banner';
        banner.id = 'installBanner';
        banner.innerHTML = `
            <div class="install-banner-content">
                <div class="install-banner-icon">🛒</div>
                <div class="install-banner-text">
                    <strong>${lang === 'hi' ? 'Quick Dukan ऐप इंस्टॉल करें' : 'Install Quick Dukan App'}</strong>
                    <span>${lang === 'hi' ? 'होम स्क्रीन पर जोड़ें — तेज़, आसान, भरोसेमंद!' : 'Add to Home Screen — Fast, Easy & Trusted!'}</span>
                </div>
                <button class="install-banner-btn" id="installBtn">
                    ${lang === 'hi' ? 'इंस्टॉल करें' : 'Install'}
                </button>
                <button class="install-banner-close" id="closeBanner">✕</button>
            </div>
        `;

        document.body.appendChild(banner);

        // Install button
        document.getElementById('installBtn').addEventListener('click', async () => {
            if (this.deferredPrompt) {
                this.deferredPrompt.prompt();
                const result = await this.deferredPrompt.userChoice;
                console.log('User install choice:', result.outcome);
                this.deferredPrompt = null;
            }
            banner.remove();
            localStorage.setItem('pwa-banner-shown', 'true');
        });

        // Close button
        document.getElementById('closeBanner').addEventListener('click', () => {
            banner.remove();
            localStorage.setItem('pwa-banner-shown', 'true');
        });

        // Auto remove after 35 seconds
        setTimeout(() => {
            if (banner.parentNode) banner.remove();
        }, 35000);
    }

    // ============================================
    // AUTO REFRESH
    // ============================================
    setupAutoRefresh() {
        // Refresh every 30 minutes
        this.refreshTimer = setInterval(() => {
            this.performRefresh();
        }, 30 * 60 * 1000);

        // Refresh when coming back online
        window.addEventListener('online', () => {
            console.log('🌐 Back online — refreshing in 2s...');
            setTimeout(() => this.performRefresh(), 2000);
        });

        // Refresh when tab becomes visible
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                const lastRefresh = localStorage.getItem('quick-dukan-last-refresh');
                const now = Date.now();
                if (!lastRefresh || (now - parseInt(lastRefresh)) > 10 * 60 * 1000) {
                    console.log('👁️ Tab visible — checking refresh...');
                    this.performRefresh();
                }
            }
        });

        console.log('🔄 Auto Refresh Active (30 min interval)');
    }

    async performRefresh() {
        if (this.isRefreshing) return;
        this.isRefreshing = true;

        console.log('🔄 Refreshing data...');

        try {
            // Reload data from server
            if (window.dataLoader) {
                window.dataLoader.allProducts = [];
                window.dataLoader.productsByCategory = {};
                window.dataLoader.isLoaded = false;
                await window.dataLoader.loadAllData();
            }

            // Refresh UI components
            if (window.productsManager) {
                window.productsManager.refreshAllProducts();
            }
            if (window.mostOrdersManager) {
                window.mostOrdersManager.checkAndShow();
            }
            if (window.recentlyViewedManager) {
                window.recentlyViewedManager.checkAndShow();
            }
            if (window.categoriesManager && window.dataLoader) {
                window.categoriesManager.renderCategories(window.dataLoader.categories);
            }

            localStorage.setItem('quick-dukan-last-refresh', Date.now().toString());
            console.log('✅ Data refreshed successfully');
        } catch (error) {
            console.error('❌ Refresh failed:', error);
        }

        this.isRefreshing = false;
    }

    forceRefresh() {
        console.log('🔄 Force refresh requested');
        return this.performRefresh();
    }

    // ============================================
    // HELPERS
    // ============================================
    showToast(message) {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = message;
        toast.classList.remove('hidden');
        toast.style.animation = 'none';
        toast.offsetHeight;
        toast.style.animation = 'slideUp 0.3s ease';

        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 2500);
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.pwaManager = new PWAManager();
});

// Expose force refresh globally
window.forceRefresh = () => {
    if (window.pwaManager) {
        window.pwaManager.forceRefresh();
    }
};