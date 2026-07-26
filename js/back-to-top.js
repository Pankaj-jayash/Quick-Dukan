// ============================================
// BACK-TO-TOP.JS - Back to Top Button Logic
// ============================================

class BackToTopManager {
    constructor() {
        this.btn = document.getElementById('backToTopBtn');
        this.scrollThreshold = 300;
        
        this.init();
    }
    
    init() {
        // Listen to scroll on main content
        const mainContent = document.getElementById('mainContent');
        
        if (mainContent) {
            mainContent.addEventListener('scroll', () => {
                this.checkScroll(mainContent.scrollTop);
            });
        }
        
        // Also listen to window scroll
        window.addEventListener('scroll', () => {
            this.checkScroll(window.scrollY);
        });
        
        // Click handler
        this.btn.addEventListener('click', () => {
            this.scrollToTop();
        });
    }
    
    checkScroll(scrollPosition) {
        if (scrollPosition > this.scrollThreshold) {
            this.show();
        } else {
            this.hide();
        }
    }
    
    show() {
        if (this.btn.classList.contains('hidden')) {
            this.btn.classList.remove('hidden');
            this.btn.classList.add('fade-in');
            setTimeout(() => this.btn.classList.remove('fade-in'), 400);
        }
    }
    
    hide() {
        this.btn.classList.add('hidden');
    }
    
    scrollToTop() {
        const mainContent = document.getElementById('mainContent');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (mainContent) {
            mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        // Animation
        this.btn.classList.add('pop-animation');
        setTimeout(() => this.btn.classList.remove('pop-animation'), 300);
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.backToTopManager = new BackToTopManager();
});

