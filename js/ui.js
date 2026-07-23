// ========== UI HELPERS ==========

const UI = {
    // Toast
    showCartToast(product, quantity) {
        const toast = document.getElementById('cartToast');
        const message = document.getElementById('toastMessage');
        
        if (!toast || !message) return;
        
        message.textContent = `✅ ${Utils.truncateText(product.name, 25)} × ${quantity} added!`;
        toast.classList.add('show');
        
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => {
            toast.classList.remove('show');
        }, CONFIG.features.toastDuration);
    },
    
    // Cart Badge
    updateCartBadge() {
        const cart = Storage.getCart();
        const badge = document.getElementById('cartBadge');
        const navBadges = document.querySelectorAll('.cart-badge');
        
        navBadges.forEach(badgeEl => {
            if (cart.totalItems > 0) {
                badgeEl.textContent = cart.totalItems > 99 ? '99+' : cart.totalItems;
                badgeEl.style.display = 'flex';
                badgeEl.classList.add('pop');
                setTimeout(() => badgeEl.classList.remove('pop'), 400);
            } else {
                badgeEl.style.display = 'none';
            }
        });
    },
    
    // Back to Top
    setupBackToTop() {
        const topBtn = document.getElementById('backToTopBtn');
        if (!topBtn) return;
        
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                topBtn.classList.add('visible');
            } else {
                topBtn.classList.remove('visible');
            }
        };
        
        window.addEventListener('scroll', Utils.debounce(toggleVisibility, 100));
        toggleVisibility();
        
        topBtn.addEventListener('click', () => {
            const icon = topBtn.querySelector('i');
            if (icon) {
                icon.classList.add('launching');
                setTimeout(() => icon.classList.remove('launching'), 600);
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    },
    
    // Bottom Nav Active State
    setActiveNav(page) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) item.classList.add('active');
        });
    },
    
    // Header Scroll Shadow
    setupHeaderScroll() {
        const header = document.getElementById('topHeader');
        if (!header) return;
        
        window.addEventListener('scroll', Utils.debounce(() => {
            if (window.scrollY > 10) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }, 50));
    },
    
    // Search Sticky Shadow
    setupSearchSticky() {
        const searchSection = document.getElementById('searchSection');
        if (!searchSection) return;
        
        window.addEventListener('scroll', Utils.debounce(() => {
            if (window.scrollY > 50) {
                searchSection.classList.add('sticky-shadow');
            } else {
                searchSection.classList.remove('sticky-shadow');
            }
        }, 50));
    },
    
    // Ripple Effect
    createRipple(event, element, color = 'rgba(255,255,255,0.3)') {
        const ripple = document.createElement('span');
        ripple.className = 'header-ripple';
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (event.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (event.clientY - rect.top - size / 2) + 'px';
        ripple.style.background = color;
        
        element.style.position = element.style.position || 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        ripple.addEventListener('animationend', () => ripple.remove());
    },
    
    // Show Popup
    showPopup(overlayId) {
        const overlay = document.getElementById(overlayId);
        if (overlay) {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    },
    
    // Hide Popup
    hidePopup(overlayId) {
        const overlay = document.getElementById(overlayId);
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    },
    
    // Close popup on outside click
    setupPopupClose(overlayId, popupSelector) {
        const overlay = document.getElementById(overlayId);
        if (!overlay) return;
        
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                UI.hidePopup(overlayId);
            }
        });
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && overlay.classList.contains('active')) {
                UI.hidePopup(overlayId);
            }
        });
    },
    
    // Navbar button navigation
    setupNavNavigation() {
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.addEventListener('click', function(e) {
                const page = this.dataset.page;
                const ripple = document.createElement('span');
                ripple.className = 'nav-ripple';
                this.appendChild(ripple);
                ripple.addEventListener('animationend', () => ripple.remove());
                
                switch(page) {
                    case 'home':
                        window.location.href = 'index.html';
                        break;
                    case 'shop':
                        window.location.href = 'shop.html';
                        break;
                    case 'cart':
                        window.location.href = 'cart.html';
                        break;
                    case 'orders':
                        UI.showPopup('ordersPopupOverlay');
                        if (typeof loadMyOrders === 'function') loadMyOrders();
                        break;
                }
            });
        });
    }
};