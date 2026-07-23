

// ========== CONTACT PAGE INIT ==========

document.addEventListener('DOMContentLoaded', () => {
    // Init theme
    Theme.init();
    
    // Setup UI
    UI.setupHeaderScroll();
    UI.setupBackToTop();
    UI.setupNavNavigation();
    UI.setActiveNav(null);
    UI.updateCartBadge();
    
    // Header brand click
    const headerBrand = document.getElementById('headerBrand');
    if (headerBrand) {
        headerBrand.addEventListener('click', function(e) {
            UI.createRipple(e, this);
            window.location.href = 'index.html';
        });
    }
    
    // My Orders button
    const ordersBtn = document.getElementById('myOrdersNavBtn');
    if (ordersBtn) {
        ordersBtn.addEventListener('click', () => {
            UI.showPopup('ordersPopupOverlay');
            if (typeof loadMyOrders === 'function') loadMyOrders();
        });
    }
    
    // Orders popup close
    const ordersPopupClose = document.getElementById('ordersPopupClose');
    if (ordersPopupClose) {
        ordersPopupClose.addEventListener('click', () => UI.hidePopup('ordersPopupOverlay'));
    }
});