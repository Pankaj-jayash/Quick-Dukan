
// ============================================
// APP.JS - Main Application File
// Connects everything together
// ============================================

class App {
    constructor() {
        this.ready = false;
        this.init();
    }
    
    async init() {
        console.log('🚀 Quick Dukan Starting...');
        console.log('🛒 आपकी विश्वसनीय किराना दुकान');
        
        // Wait for all managers to initialize
        await this.waitForDataLoader();
        
        // Setup global event listeners
        this.setupGlobalListeners();
        
        // Initial UI setup
        this.initialUISetup();
        
        this.ready = true;
        console.log('✅ Quick Dukan Ready!');
    }
    
    async waitForDataLoader() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (window.dataLoader && window.dataLoader.isLoaded) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
            
            // Timeout after 10 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                console.warn('⚠️ Data loading timeout');
                resolve();
            }, 10000);
        });
    }
    
    setupGlobalListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+K or / to focus search
            if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !e.ctrlKey && !e.metaKey)) {
                e.preventDefault();
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.focus();
                }
            }
            
            // Escape to close cart
            if (e.key === 'Escape') {
                if (window.cartManager) {
                    window.cartManager.closeCart();
                }
            }
        });
        
        // Handle offline/online
        window.addEventListener('online', () => {
            this.showNetworkStatus('✅ आप ऑनलाइन हैं!', 'success');
        });
        
        window.addEventListener('offline', () => {
            this.showNetworkStatus('⚠️ आप ऑफलाइन हैं। कुछ सुविधाएँ काम नहीं करेंगी।', 'warning');
        });
        
        // Service worker registration (for PWA later)
        if ('serviceWorker' in navigator) {
            // Will be implemented for PWA
            console.log('📱 PWA ready for future implementation');
        }
    }
    
    initialUISetup() {
        // Ensure sections are in correct initial state
        const categoryProductsSection = document.getElementById('categoryProductsSection');
        if (categoryProductsSection) {
            categoryProductsSection.classList.add('hidden');
        }
        
        // Recently viewed - check if there are items
        if (window.recentlyViewedManager) {
            window.recentlyViewedManager.checkAndShow();
        }
        
        // Most orders - always visible initially
        if (window.mostOrdersManager) {
            window.mostOrdersManager.checkAndShow();
        }
        
        // Set initial language
        if (window.languageManager) {
            window.languageManager.applyLanguage();
        }
    }
    
    showNetworkStatus(message, type) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.style.background = type === 'success' ? '#2E7D32' : '#F57F17';
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
            toast.style.background = '#333';
        }, 3000);
    }
}

// Initialize app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Handle errors globally
window.addEventListener('error', (e) => {
    console.error('❌ Global Error:', e.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
    console.error('❌ Unhandled Promise Rejection:', e.reason);
});
