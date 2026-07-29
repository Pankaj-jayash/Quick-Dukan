// ============================================
// PWA.JS - Service Worker + Install + Online/Offline
// ============================================

class PWAManager {
    constructor() {
        this.deferredPrompt = null;
        this.refreshTimer = null;
        this.isRefreshing = false;
        this.isOnline = navigator.onLine;
        this.offlineNotifier = null;

        this.init();
    }

    init() {
        console.log('📱 PWA Manager Initialized');

        // Register Service Worker
        this.registerServiceWorker();

        // Show splash screen
        this.showSplashScreen();

        // Setup install prompt
        this.setupInstallPrompt();

        // Setup online/offline detection
        this.setupNetworkDetection();

        // Setup auto refresh
        this.setupAutoRefresh();

        // Setup push notifications
        this.setupPushNotifications();

        // Hide splash after everything loads
        this.waitAndHideSplash();
    }

    // ============================================
    // SERVICE WORKER REGISTRATION
    // ============================================
    registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.warn('⚠️ Service Worker not supported');
            return;
        }

        navigator.serviceWorker.register('/quick-dukan/pwa-server.js')
            .then((registration) => {
                console.log('✅ Service Worker Registered:', registration.scope);

                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New update available
                            this.showUpdatePrompt();
                        }
                    });
                });
            })
            .catch((error) => {
                console.error('❌ Service Worker Registration Failed:', error);
            });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data?.type === 'VERSION') {
                console.log('📦 SW Version:', event.data.version);
            }
        });
    }

    // ============================================
    // UPDATE PROMPT
    // ============================================
    showUpdatePrompt() {
        const lang = window.languageManager?.currentLang || 'hi';
        
        const banner = document.createElement('div');
        banner.className = 'update-banner';
        banner.innerHTML = `
            <div class="update-banner-content">
                <span class="update-icon">🔄</span>
                <span>${lang === 'hi' ? 'नया वर्जन उपलब्ध है!' : 'New version available!'}</span>
                <button class="update-btn" id="updateNowBtn">
                    ${lang === 'hi' ? 'अभी अपडेट करें' : 'Update Now'}
                </button>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        document.getElementById('updateNowBtn').addEventListener('click', () => {
            banner.remove();
            this.updateApp();
        });

        // Auto dismiss after 20 seconds
        setTimeout(() => {
            if (banner.parentNode) banner.remove();
        }, 20000);
    }

    updateApp() {
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        }
        window.location.reload();
    }

    // ============================================
    // NETWORK DETECTION
    // ============================================
    setupNetworkDetection() {
        window.addEventListener('online', () => {
            console.log('🌐 Back Online!');
            this.isOnline = true;
            this.hideOfflineNotification();
            this.showOnlineToast();
            
            // Refresh data after 2 seconds
            setTimeout(() => this.performRefresh(), 2000);
        });

        window.addEventListener('offline', () => {
            console.log('📴 Offline Detected!');
            this.isOnline = false;
            this.showOfflineNotification();
        });

        // Initial check
        if (!this.isOnline) {
            this.showOfflineNotification();
        }
    }

    // ============================================
    // OFFLINE NOTIFICATION (Using OfflineNotification class)
    // ============================================
    showOfflineNotification() {
        if (window.offlineNotifier) {
            window.offlineNotifier.show();
        } else {
            // Fallback
            this.showToast('📴 आप ऑफ़लाइन हैं! लेकिन ऐप फिर भी चलेगा 💪');
        }
    }

    hideOfflineNotification() {
        if (window.offlineNotifier) {
            window.offlineNotifier.hide();
        }
    }

    showOnlineToast() {
        this.showToast('🌐 आप वापस ऑनलाइन आ गए! 🎉');
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
        const checkData = setInterval(() => {
            if (window.dataLoader && window.dataLoader.isLoaded) {
                clearInterval(checkData);
                setTimeout(() => this.hideSplashScreen(), 800);
            }
        }, 100);

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

            setTimeout(() => this.showInstallBanner(), 8000);
        });

        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA Installed Successfully!');
            this.deferredPrompt = null;
            localStorage.setItem('pwa-installed', 'true');
            this.showToast('🎉 Quick Dukan ऐप इंस्टॉल हो गया!');
        });

        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('📱 Already running as PWA');
        }
    }

    showInstallBanner() {
        if (!this.deferredPrompt) return;
        if (localStorage.getItem('pwa-banner-shown')) return;
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

        document.getElementById('closeBanner').addEventListener('click', () => {
            banner.remove();
            localStorage.setItem('pwa-banner-shown', 'true');
        });

        setTimeout(() => {
            if (banner.parentNode) banner.remove();
        }, 35000);
    }

    // ============================================
    // PUSH NOTIFICATIONS
    // ============================================
    setupPushNotifications() {
        if (!('Notification' in window)) {
            console.log('📵 Push notifications not supported');
            return;
        }

        // Request permission after 15 seconds
        setTimeout(() => {
            if (Notification.permission === 'default') {
                this.showNotificationPrompt();
            }
        }, 15000);
    }

    showNotificationPrompt() {
        if (localStorage.getItem('notification-prompt-shown')) return;
        if (Notification.permission !== 'default') return;

        const lang = window.languageManager?.currentLang || 'hi';

        const banner = document.createElement('div');
        banner.className = 'notification-prompt';
        banner.innerHTML = `
            <div class="notification-prompt-content">
                <span class="notif-icon">🔔</span>
                <div class="notif-text">
                    <strong>${lang === 'hi' ? 'नोटिफिकेशन चालू करें?' : 'Enable Notifications?'}</strong>
                    <span>${lang === 'hi' ? 'नए ऑफर्स और अपडेट सबसे पहले पाएं!' : 'Get new offers and updates first!'}</span>
                </div>
                <button class="notif-enable-btn" id="enableNotifBtn">
                    ${lang === 'hi' ? 'हाँ, चालू करें' : 'Yes, Enable'}
                </button>
                <button class="notif-later-btn" id="notifLaterBtn">
                    ${lang === 'hi' ? 'बाद में' : 'Later'}
                </button>
            </div>
        `;

        document.body.appendChild(banner);

        document.getElementById('enableNotifBtn').addEventListener('click', () => {
            this.requestNotificationPermission();
            banner.remove();
            localStorage.setItem('notification-prompt-shown', 'true');
        });

        document.getElementById('notifLaterBtn').addEventListener('click', () => {
            banner.remove();
            localStorage.setItem('notification-prompt-shown', 'true');
        });
    }

    requestNotificationPermission() {
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
                console.log('🔔 Notification permission granted');
                this.showToast('🔔 नोटिफिकेशन चालू हो गए!');
                
                // Send welcome notification
                if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
                    navigator.serviceWorker.ready.then((registration) => {
                        registration.showNotification('Quick Dukan 🛒', {
                            body: 'स्वागत है! नए ऑफर्स की जानकारी सबसे पहले आपको मिलेगी 🎉',
                            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%232E7D32"/><text x="50" y="65" text-anchor="middle" font-size="40">🛒</text></svg>',
                            tag: 'welcome',
                            vibrate: [200, 100, 200]
                        });
                    });
                }
            }
        });
    }

    // ============================================
    // AUTO REFRESH
    // ============================================
    setupAutoRefresh() {
        this.refreshTimer = setInterval(() => {
            this.performRefresh();
        }, 30 * 60 * 1000);

        window.addEventListener('online', () => {
            setTimeout(() => this.performRefresh(), 2000);
        });

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                const lastRefresh = localStorage.getItem('quick-dukan-last-refresh');
                const now = Date.now();
                if (!lastRefresh || (now - parseInt(lastRefresh)) > 10 * 60 * 1000) {
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
            if (window.dataLoader) {
                window.dataLoader.allProducts = [];
                window.dataLoader.productsByCategory = {};
                window.dataLoader.isLoaded = false;
                await window.dataLoader.loadAllData();
            }

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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.pwaManager = new PWAManager();
});

window.forceRefresh = () => {
    if (window.pwaManager) {
        window.pwaManager.forceRefresh();
    }
};