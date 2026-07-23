/* ═══════════════════════════════════════════ */
/* HOME PAGE — Initialization                */
/* ═══════════════════════════════════════════ */

(function() {
    'use strict';
    
    // Initialize when DOM is ready
    function init() {
        console.log('🏠 Quick Dukan — Home Page Initializing...');
        
        // Initialize theme
        Theme.init();
        
        // Initialize UI (Header, Search, Bottom Nav)
        UI.initAll();
        
        // Initialize search
        Search.init();
        
        // Set active nav
        UI.setActiveNav('home');
        
        // Update cart badge
        UI.updateCartBadge();
        
        console.log('✅ Home Page Ready!');
        console.log('📋 Sections Loaded: Top Header, Smart Search Bar, Bottom Navbar');
        console.log('⏳ Pending: Recently Viewed, Categories, Most Ordered, Product Cards');
    }
    
    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

