// ============================================
// BOTTOM-NAV.JS - Bottom Navigation Logic
// ============================================

class BottomNavManager {
    constructor() {
        this.navButtons = document.querySelectorAll('#bottomNav .nav-btn');
        this.activeNav = 'home';
        
        this.init();
    }
    
    init() {
        this.navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const navTarget = btn.getAttribute('data-nav');
                this.handleNavClick(navTarget, btn);
            });
        });
        
        // Set initial active button
        this.setActiveByTarget('home');
    }
    
    handleNavClick(target, btn) {
        // Skip if it's the back-to-top button (handled separately)
        if (target === 'top') return;
        
        // Set active
        this.setActive(btn);
        this.activeNav = target;
        
        switch (target) {
            case 'home':
                this.goHome();
                break;
            case 'search':
                this.focusSearch();
                break;
            case 'cart':
                this.openCart();
                break;
            case 'orders':
                this.openOrders();
                break;
        }
        
        // Pop animation on click
        if (btn) {
            btn.classList.add('pop-animation');
            setTimeout(() => btn.classList.remove('pop-animation'), 300);
        }
    }
    
    setActive(activeBtn) {
        this.navButtons.forEach(btn => btn.classList.remove('active'));
        if (activeBtn && activeBtn.getAttribute('data-nav') !== 'top') {
            activeBtn.classList.add('active');
        }
    }
    
    setActiveByTarget(target) {
        const btn = document.querySelector(`[data-nav="${target}"]`);
        if (btn && target !== 'top') {
            this.setActive(btn);
            this.activeNav = target;
        }
    }
    
    goHome() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        // Reset to "All" category
        const allBtn = document.querySelector('[data-category="all"]');
        if (allBtn) {
            allBtn.click();
        }
    }
    
    focusSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            searchInput.classList.add('shake-animation');
            setTimeout(() => searchInput.classList.remove('shake-animation'), 400);
        }
    }
    
    openCart() {
        // Try cartManager first
        if (window.cartManager && typeof window.cartManager.openCart === 'function') {
            window.cartManager.openCart();
            return;
        }
        
        // Fallback
        const cartModal = document.getElementById('cartModal');
        if (cartModal) {
            cartModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            if (window.cartManager && typeof window.cartManager.renderCart === 'function') {
                window.cartManager.renderCart();
            }
        }
    }
    
    openOrders() {
        // Try ordersManager first
        if (window.ordersManager && typeof window.ordersManager.open === 'function') {
            window.ordersManager.open();
            return;
        }
        
        // Fallback: try to find and show orders modal manually
        const ordersModal = document.getElementById('ordersModal');
        if (ordersModal) {
            ordersModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            // Try to render orders if function exists
            if (window.ordersManager && typeof window.ordersManager.render === 'function') {
                window.ordersManager.render();
            }
        } else {
            console.warn('⚠️ Orders modal not found in DOM');
            const lang = window.languageManager?.currentLang || 'hi';
            const msg = lang === 'hi' 
                ? '📋 ऑर्डर हिस्ट्री जल्द ही उपलब्ध होगी!'
                : '📋 Order history coming soon!';
            alert(msg);
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.bottomNavManager = new BottomNavManager();
});