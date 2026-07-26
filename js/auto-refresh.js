// ============================================
// AUTO-REFRESH.JS - Auto Refresh System
// No need to clear browser cache
// ============================================

class AutoRefreshManager {
    constructor() {
        this.version = '1.0.0';
        this.versionKey = 'quick-dukan-version';
        this.lastRefreshKey = 'quick-dukan-last-refresh';
        this.refreshInterval = 30 * 60 * 1000; // 30 minutes
        this.checkInterval = 5 * 60 * 1000; // Check every 5 minutes
        this.isRefreshing = false;
        
        this.init();
    }
    
    init() {
        console.log('🔄 Auto Refresh Manager Initialized');
        
        // Check version on load
        this.checkVersion();
        
        // Register service worker
        this.registerServiceWorker();
        
        // Set up periodic refresh check
        this.startPeriodicCheck();
        
        // Refresh data files periodically
        this.startDataRefresh();
        
        // Listen for online event
        window.addEventListener('online', () => {
            console.log('🌐 Back online - Refreshing...');
            this.refreshData();
        });
        
        // Refresh on page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.checkIfRefreshNeeded();
            }
        });
        
        console.log('✅ Auto Refresh System Ready');
    }
    
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/js/service-worker.js')
                .then(registration => {
                    console.log('📦 Service Worker Registered:', registration.scope);
                    
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        console.log('🔄 New Service Worker found!');
                        
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log('🔄 Update available - Refreshing...');
                                this.showUpdateNotification();
                            }
                        });
                    });
                })
                .catch(error => {
                    console.log('⚠️ Service Worker registration failed:', error);
                });
        }
    }
    
    checkVersion() {
        const savedVersion = localStorage.getItem(this.versionKey);
        
        if (savedVersion !== this.version) {
            console.log('🔄 New version detected! Clearing cache...');
            this.clearCache();
            localStorage.setItem(this.versionKey, this.version);
        }
    }
    
    clearCache() {
        // Clear localStorage (except user info and cart)
        const keepKeys = [
            'quick-dukan-user-info',
            'quick-dukan-location',
            'quick-dukan-cart',
            'quick-dukan-orders',
            'quick-dukan-theme',
            'quick-dukan-lang',
            this.versionKey,
        ];
        
        // Get keys to keep
        const keepData = {};
        keepKeys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) keepData[key] = value;
        });
        
        // Clear all
        localStorage.clear();
        
        // Restore kept keys
        Object.keys(keepData).forEach(key => {
            localStorage.setItem(key, keepData[key]);
        });
        
        // Clear session storage
        sessionStorage.clear();
        
        // Clear caches if available
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    if (name !== 'quick-dukan-v1') {
                        caches.delete(name);
                    }
                });
            });
        }
        
        console.log('✅ Cache cleared successfully');
    }
    
    startPeriodicCheck() {
        setInterval(() => {
            this.checkIfRefreshNeeded();
        }, this.checkInterval);
    }
    
    checkIfRefreshNeeded() {
        const lastRefresh = localStorage.getItem(this.lastRefreshKey);
        const now = Date.now();
        
        if (!lastRefresh || (now - parseInt(lastRefresh)) >= this.refreshInterval) {
            this.refreshData();
        }
    }
    
    startDataRefresh() {
        // Refresh data files every 30 minutes
        setInterval(() => {
            this.refreshData();
        }, this.refreshInterval);
    }
    
    async refreshData() {
        if (this.isRefreshing) return;
        
        this.isRefreshing = true;
        console.log('🔄 Refreshing data...');
        
        try {
            // Reload data from server
            if (window.dataLoader && window.dataLoader.isLoaded) {
                // Clear existing data
                window.dataLoader.allProducts = [];
                window.dataLoader.productsByCategory = {};
                window.dataLoader.isLoaded = false;
                
                // Reload
                await window.dataLoader.loadAllData();
                
                // Refresh UI
                this.refreshUI();
            }
            
            // Update last refresh time
            localStorage.setItem(this.lastRefreshKey, Date.now().toString());
            
            console.log('✅ Data refreshed successfully');
        } catch (error) {
            console.error('❌ Refresh failed:', error);
        }
        
        this.isRefreshing = false;
    }
    
    refreshUI() {
        // Refresh all products
        if (window.productsManager) {
            window.productsManager.refreshAllProducts();
        }
        
        // Refresh categories
        if (window.categoriesManager) {
            const categories = window.dataLoader.categories;
            if (categories.length > 0) {
                window.categoriesManager.renderCategories(categories);
            }
        }
        
        // Refresh most orders
        if (window.mostOrdersManager) {
            window.mostOrdersManager.checkAndShow();
        }
        
        // Refresh recently viewed
        if (window.recentlyViewedManager) {
            window.recentlyViewedManager.checkAndShow();
        }
        
        // Update cart if open
        const cartModal = document.getElementById('cartModal');
        if (cartModal && !cartModal.classList.contains('hidden') && window.cartManager) {
            window.cartManager.renderCart();
        }
        
        // Update orders if open
        const ordersModal = document.getElementById('ordersModal');
        if (ordersModal && !ordersModal.classList.contains('hidden') && window.ordersManager) {
            window.ordersManager.render();
        }
        
        console.log('✅ UI refreshed');
    }
    
    showUpdateNotification() {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = '🔄 नया अपडेट! पेज रिफ्रेश हो रहा है...';
        toast.classList.remove('hidden');
        toast.style.animation = 'none';
        toast.offsetHeight;
        toast.style.animation = 'slideUp 0.3s ease';
        
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }
    
    // Force refresh (can be called from console)
    forceRefresh() {
        console.log('🔄 Force refresh...');
        this.clearCache();
        window.location.reload();
    }
    
    // Manual version update
    updateVersion(newVersion) {
        this.version = newVersion;
        localStorage.setItem(this.versionKey, newVersion);
        this.clearCache();
        window.location.reload();
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.autoRefreshManager = new AutoRefreshManager();
});

// Expose force refresh globally
window.forceRefresh = () => {
    if (window.autoRefreshManager) {
        window.autoRefreshManager.forceRefresh();
    }
};

window.updateAppVersion = (version) => {
    if (window.autoRefreshManager) {
        window.autoRefreshManager.updateVersion(version);
    }
};