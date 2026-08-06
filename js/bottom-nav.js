// ============================================
// BOTTOM-NAV.JS - Bottom Navigation Logic
// With Smart Scroll Behavior (Fixed)
// ============================================

class BottomNavManager {
    constructor() {
        this.navButtons = document.querySelectorAll('#bottomNav .nav-btn');
        this.bottomNav = document.getElementById('bottomNav');
        this.backToTopBtn = document.getElementById('backToTopBtn');
        this.mainContent = document.getElementById('mainContent');
        this.activeNav = 'home';
        
        // Scroll tracking
        this.lastScrollTop = 0;
        this.scrollThreshold = 60;
        this.hideThreshold = 100;
        this.isNavHidden = false;
        this.isBackToTopVisible = false;
        this.scrollTimer = null;
        this.isScrollingToTop = false;
        this.scrollEndTimer = null;
        
        this.init();
    }
    
    init() {
        // Nav button clicks
        this.navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const navTarget = btn.getAttribute('data-nav');
                this.handleNavClick(navTarget, btn);
            });
        });
        
        this.setActiveByTarget('home');
        
        // Back to top click
        if (this.backToTopBtn) {
            this.backToTopBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.scrollToTop();
            });
        }
        
        // Scroll tracking
        if (this.mainContent) {
            this.mainContent.addEventListener('scroll', () => {
                if (!this.isScrollingToTop) {
                    this.handleScroll();
                }
            }, { passive: true });
        }
        
        // Initial state
        this.ensureCorrectInitialState();
    }
    
    ensureCorrectInitialState() {
        if (this.backToTopBtn) {
            this.backToTopBtn.classList.add('hidden');
            this.backToTopBtn.classList.remove('visible', 'navbar-hidden');
            this.isBackToTopVisible = false;
        }
        
        if (this.bottomNav) {
            this.bottomNav.classList.remove('nav-hidden');
            this.isNavHidden = false;
        }
        
        if (this.mainContent) {
            this.mainContent.style.bottom = 'var(--bottom-nav-height)';
        }
        
        this.lastScrollTop = 0;
    }
    
    handleNavClick(target, btn) {
        if (!target) return;
        this.setActive(btn);
        this.activeNav = target;
        
        switch (target) {
            case 'home': this.goHome(); break;
            case 'search': this.focusSearch(); break;
            case 'cart': this.openCart(); break;
            case 'orders': this.openOrders(); break;
        }
        
        if (btn) {
            btn.classList.add('pop-animation');
            setTimeout(() => btn.classList.remove('pop-animation'), 300);
        }
    }
    
    setActive(activeBtn) {
        this.navButtons.forEach(btn => btn.classList.remove('active'));
        if (activeBtn) activeBtn.classList.add('active');
    }
    
    setActiveByTarget(target) {
        const btn = document.querySelector(`[data-nav="${target}"]`);
        if (btn) {
            this.setActive(btn);
            this.activeNav = target;
        }
    }
    
    // ============================================
    // SCROLL HANDLER
    // ============================================
    handleScroll() {
        if (!this.mainContent || this.isScrollingToTop) return;
        
        const scrollTop = this.mainContent.scrollTop;
        const maxScroll = this.mainContent.scrollHeight - this.mainContent.clientHeight;
        const isAtTop = scrollTop <= this.scrollThreshold;
        
        // Content too short
        if (maxScroll <= this.scrollThreshold * 2) {
            this.showNavbar();
            this.hideBackToTop();
            this.lastScrollTop = scrollTop;
            return;
        }
        
        const scrollDifference = scrollTop - this.lastScrollTop;
        this.lastScrollTop = scrollTop;
        
        const isScrollingDown = scrollDifference > 8;
        const isScrollingUp = scrollDifference < -5;
        
        if (isAtTop) {
            this.showNavbar();
            this.hideBackToTop();
        } else if (isScrollingDown && scrollTop > this.hideThreshold) {
            this.hideNavbar();
            this.showBackToTop();
        } else if (isScrollingUp) {
            this.showNavbar();
            if (!isAtTop) this.showBackToTop();
        }
        
        // Debounce check after scroll stops
        if (this.scrollTimer) clearTimeout(this.scrollTimer);
        this.scrollTimer = setTimeout(() => {
            if (this.isScrollingToTop) return;
            const finalScroll = this.mainContent.scrollTop;
            if (finalScroll <= this.scrollThreshold) {
                this.showNavbar();
                this.hideBackToTop();
            }
        }, 300);
    }
    
    // ============================================
    // NAVBAR
    // ============================================
    showNavbar() {
        if (this.isNavHidden && this.bottomNav) {
            this.bottomNav.classList.remove('nav-hidden');
            this.isNavHidden = false;
            if (this.mainContent) {
                this.mainContent.style.bottom = 'var(--bottom-nav-height)';
            }
            if (this.backToTopBtn && this.isBackToTopVisible) {
                this.backToTopBtn.classList.remove('navbar-hidden');
            }
        }
    }
    
    hideNavbar() {
        if (!this.isNavHidden && this.bottomNav) {
            this.bottomNav.classList.add('nav-hidden');
            this.isNavHidden = true;
            if (this.mainContent) {
                this.mainContent.style.bottom = '0px';
            }
            if (this.backToTopBtn && this.isBackToTopVisible) {
                this.backToTopBtn.classList.add('navbar-hidden');
            }
        }
    }
    
    // ============================================
    // BACK TO TOP
    // ============================================
    showBackToTop() {
        if (!this.isBackToTopVisible && this.backToTopBtn) {
            // Remove hidden first
            this.backToTopBtn.classList.remove('hidden');
            // Force reflow
            void this.backToTopBtn.offsetWidth;
            // Add visible
            this.backToTopBtn.classList.add('visible');
            this.isBackToTopVisible = true;
            
            if (this.isNavHidden) {
                this.backToTopBtn.classList.add('navbar-hidden');
            } else {
                this.backToTopBtn.classList.remove('navbar-hidden');
            }
        }
    }
    
    hideBackToTop() {
        if (this.isBackToTopVisible && this.backToTopBtn) {
            this.backToTopBtn.classList.remove('visible', 'navbar-hidden');
            this.backToTopBtn.classList.add('hidden');
            this.isBackToTopVisible = false;
        }
    }
    
    // ============================================
    // SCROLL TO TOP - FULLY FIXED
    // ============================================
    scrollToTop() {
        // IMMEDIATELY hide back-to-top button
        this.hideBackToTop();
        
        // Set flag to block scroll events
        this.isScrollingToTop = true;
        
        // Show navbar
        this.showNavbar();
        
        // Set home active
        this.setActiveByTarget('home');
        
        // Scroll to top
        if (this.mainContent) {
            this.mainContent.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
        
        // Reset main content bottom spacing
        if (this.mainContent) {
            this.mainContent.style.bottom = 'var(--bottom-nav-height)';
        }
        
        // Clear any pending timers
        if (this.scrollTimer) clearTimeout(this.scrollTimer);
        if (this.scrollEndTimer) clearTimeout(this.scrollEndTimer);
        
        // After animation completes, reset state
        this.scrollEndTimer = setTimeout(() => {
            this.isScrollingToTop = false;
            this.lastScrollTop = 0;
            
            // Force correct state
            this.showNavbar();
            this.hideBackToTop();
            
            if (this.mainContent) {
                this.mainContent.style.bottom = 'var(--bottom-nav-height)';
            }
            
            // Reset all categories
            const allBtn = document.querySelector('[data-category="all"]');
            if (allBtn && !allBtn.classList.contains('active')) {
                allBtn.click();
            }
        }, 600);
    }
    
    // ============================================
    // PUBLIC API
    // ============================================
    updateUIState(showNav, showBackToTop = null) {
        if (showNav) this.showNavbar();
        else this.hideNavbar();
        
        if (showBackToTop === true) this.showBackToTop();
        else if (showBackToTop === false) this.hideBackToTop();
    }
    
    goHome() {
        this.scrollToTop();
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
        if (window.cartManager?.openCart) {
            window.cartManager.openCart();
            return;
        }
        const cartModal = document.getElementById('cartModal');
        if (cartModal) {
            cartModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            window.cartManager?.renderCart?.();
        }
    }
    
    openOrders() {
        if (window.ordersManager?.open) {
            window.ordersManager.open();
            return;
        }
        const ordersModal = document.getElementById('ordersModal');
        if (ordersModal) {
            ordersModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            window.ordersManager?.render?.();
        } else {
            const lang = window.languageManager?.currentLang || 'hi';
            alert(lang === 'hi' ? '📋 ऑर्डर हिस्ट्री जल्द ही उपलब्ध होगी!' : '📋 Order history coming soon!');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.bottomNavManager = new BottomNavManager();
});