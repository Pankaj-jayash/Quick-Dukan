'use strict';

// ============================================
// APP.JS - Main Application File
// With Scroll-Based Section Title Effects
// ============================================

class App {
    constructor() {
        this.ready = false;
        this.scrollObservers = [];
        this.init();
    }

    async init() {
        console.log('🚀 Quick Dukan Starting...');
        console.log('🛒 आपकी विश्वसनीय किराना दुकान');

        // Wait for all managers to initialize
        await this.waitForDataLoader();

        // Setup global event listeners
        this.setupGlobalListeners();

        // Setup scroll-based title effects
        this.setupScrollTitleEffects();

        // Initial UI setup
        this.initialUISetup();

        // Security check
        this.checkSecurityStatus();

        // Performance optimization
        this.optimizePerformance();

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
                // Close any open modals
                document.querySelectorAll('.modal:not(.hidden), .cart-modal:not(.hidden), .orders-modal:not(.hidden), .checkout-modal:not(.hidden), .footer-modal:not(.hidden)').forEach(modal => {
                    modal.classList.add('hidden');
                    document.body.style.overflow = '';
                });
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
            console.log('📱 PWA ready for future implementation');
        }

        // Window resize handler
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.updateAllScrollStates();
            }, 150);
        });

        // Scroll performance optimization
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                this.handleScroll();
            }, 50);
        }, { passive: true });
    }

    // ============================================
    // SCROLL-BASED TITLE EFFECTS
    // ============================================
    setupScrollTitleEffects() {
        // Wait for DOM to be fully rendered
        setTimeout(() => {
            this.initHorizontalScrollEffects();
            this.initCategoriesScrollEffect();
            this.initSectionTitleEffects();
        }, 500);
    }

    initHorizontalScrollEffects() {
        // Recently Viewed Section
        const recentlyViewedScroll = document.querySelector('#recentlyViewedScroll');
        const recentlyViewedSection = document.getElementById('recentlyViewedSection');

        if (recentlyViewedScroll && recentlyViewedSection) {
            this.addScrollEffect(recentlyViewedScroll, recentlyViewedSection);
        }

        // Most Orders Section
        const mostOrdersScroll = document.querySelector('#mostOrdersScroll');
        const mostOrdersSection = document.getElementById('mostOrdersSection');

        if (mostOrdersScroll && mostOrdersSection) {
            this.addScrollEffect(mostOrdersScroll, mostOrdersSection);
        }

        // Any other horizontal scroll sections
        document.querySelectorAll('.horizontal-scroll').forEach(scroll => {
            const section = scroll.closest('section');
            if (section && !section.classList.contains('scroll-effect-added')) {
                this.addScrollEffect(scroll, section);
            }
        });
    }

    addScrollEffect(scrollElement, sectionElement) {
        // Mark section to avoid duplicate listeners
        sectionElement.classList.add('scroll-effect-added');

        // Scroll event listener
        const handleScroll = () => {
            const scrollLeft = scrollElement.scrollLeft;

            if (scrollLeft > 15) {
                sectionElement.classList.add('scrolled');
            } else {
                sectionElement.classList.remove('scrolled');
            }

            // Update scroll buttons if they exist
            this.updateScrollArrows(sectionElement, scrollElement);
        };

        scrollElement.addEventListener('scroll', handleScroll, { passive: true });

        // Touch events for mobile
        scrollElement.addEventListener('touchstart', () => {
            sectionElement.classList.add('scrolling');
        }, { passive: true });

        scrollElement.addEventListener('touchend', () => {
            setTimeout(() => {
                sectionElement.classList.remove('scrolling');
                handleScroll();
            }, 100);
        });

        // Store for cleanup
        this.scrollObservers.push({
            element: scrollElement,
            handler: handleScroll,
            section: sectionElement
        });

        // Initial check
        handleScroll();
    }

    initCategoriesScrollEffect() {
        const categoriesScroll = document.getElementById('categoriesScroll');
        const categoriesSection = document.getElementById('categoriesSection');

        if (!categoriesScroll || !categoriesSection) return;

        const handleCategoriesScroll = () => {
            const scrollLeft = categoriesScroll.scrollLeft;
            const maxScroll = categoriesScroll.scrollWidth - categoriesScroll.clientWidth;

            // Add scrolled class for title effect
            if (scrollLeft > 10) {
                categoriesSection.classList.add('categories-scrolled');
            } else {
                categoriesSection.classList.remove('categories-scrolled');
            }

            // Adjust button sizes based on scroll position
            this.updateCategoryButtonSizes(categoriesScroll, scrollLeft, maxScroll);
        };

        categoriesScroll.addEventListener('scroll', handleCategoriesScroll, { passive: true });

        this.scrollObservers.push({
            element: categoriesScroll,
            handler: handleCategoriesScroll,
            section: categoriesSection
        });

        // Initial check
        handleCategoriesScroll();
    }

    initSectionTitleEffects() {
        // All products section title shrink effect on scroll
        const allProductsSection = document.getElementById('allProductsSection');
        if (allProductsSection) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        allProductsSection.classList.add('visible');
                    } else {
                        allProductsSection.classList.remove('visible');
                    }
                });
            }, { threshold: 0.2 });
            observer.observe(allProductsSection);
        }

        // Category products section
        const categoryProductsSection = document.getElementById('categoryProductsSection');
        if (categoryProductsSection) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        categoryProductsSection.classList.add('visible');
                    } else {
                        categoryProductsSection.classList.remove('visible');
                    }
                });
            }, { threshold: 0.2 });
            observer.observe(categoryProductsSection);
        }
    }

    updateCategoryButtonSizes(scrollElement, scrollLeft, maxScroll) {
        const buttons = scrollElement.querySelectorAll('.category-btn:not(.active)');

        buttons.forEach((btn) => {
            const rect = btn.getBoundingClientRect();
            const containerRect = scrollElement.getBoundingClientRect();

            // Button center relative to container
            const btnCenter = rect.left + rect.width / 2 - containerRect.left;
            const containerCenter = containerRect.width / 2;

            // Distance from center (0 to 1)
            const distanceFromCenter = Math.abs(btnCenter - containerCenter) / containerCenter;

            // Scale: center buttons bigger, edge buttons smaller
            const scale = 1 - (distanceFromCenter * 0.15);
            const finalScale = Math.max(0.8, Math.min(1, scale));

            // Apply smooth transform
            btn.style.transform = `scale(${finalScale})`;
            btn.style.opacity = 1 - (distanceFromCenter * 0.3);
        });
    }

    updateScrollArrows(section, scrollElement) {
        const scrollLeft = section.querySelector('.scroll-left');
        const scrollRight = section.querySelector('.scroll-right');

        if (!scrollLeft && !scrollRight) return;

        const { scrollLeft: sl, scrollWidth, clientWidth } = scrollElement;

        if (scrollLeft) {
            if (sl <= 3) {
                scrollLeft.classList.add('disabled');
                scrollLeft.setAttribute('aria-disabled', 'true');
            } else {
                scrollLeft.classList.remove('disabled');
                scrollLeft.setAttribute('aria-disabled', 'false');
            }
        }

        if (scrollRight) {
            if (sl + clientWidth >= scrollWidth - 3) {
                scrollRight.classList.add('disabled');
                scrollRight.setAttribute('aria-disabled', 'true');
            } else {
                scrollRight.classList.remove('disabled');
                scrollRight.setAttribute('aria-disabled', 'false');
            }
        }
    }

    updateAllScrollStates() {
        this.scrollObservers.forEach(({ handler }) => {
            if (typeof handler === 'function') {
                handler();
            }
        });
    }

    handleScroll() {
        // Handle back to top button
        const backToTopBtn = document.getElementById('backToTopBtn');
        if (backToTopBtn) {
            if (window.scrollY > 300) {
                backToTopBtn.classList.remove('hidden');
            } else {
                backToTopBtn.classList.add('hidden');
            }
        }

        // Animate sections on scroll
        document.querySelectorAll('.section-title').forEach(title => {
            const rect = title.getBoundingClientRect();
            if (rect.top < window.innerHeight - 100) {
                title.classList.add('animated');
            }
        });
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

        // Hide skeleton after load
        setTimeout(() => {
            const skeleton = document.getElementById('productsSkeleton');
            if (skeleton) {
                skeleton.style.display = 'none';
            }
        }, 2000);

        // Check if cart has items and update badge
        if (window.cartManager) {
            setTimeout(() => {
                window.cartManager.updateCartBadge();
            }, 100);
        }
    }

    checkSecurityStatus() {
        // Check if security module is loaded
        if (window.security) {
            const status = window.security.isSecure();
            if (status) {
                console.log('🔐 Security status:', status);
            }
        } else {
            console.warn('⚠️ Security module not loaded');
        }

        // Check for CSRF token
        const csrfField = document.getElementById('csrfToken');
        if (csrfField && csrfField.value) {
            console.log('✅ CSRF token present');
        }
    }

    optimizePerformance() {
        // Lazy load images
        this.setupLazyLoading();

        // Defer non-critical operations
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.deferredOperations();
            });
        } else {
            setTimeout(() => {
                this.deferredOperations();
            }, 3000);
        }
    }

    setupLazyLoading() {
        // Use Intersection Observer for images
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        imageObserver.unobserve(img);
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }
    }

    deferredOperations() {
        // Preload next page resources
        // Analytics tracking (if added)
        // Prefetch common images
        console.log('⏳ Deferred operations completed');
    }

    showNetworkStatus(message, type) {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = message;
        toast.style.background = type === 'success' ? '#2E7D32' : '#F57F17';
        toast.classList.remove('hidden');

        clearTimeout(toast._networkTimeout);
        toast._networkTimeout = setTimeout(() => {
            toast.classList.add('hidden');
            toast.style.background = '#333';
        }, 3000);
    }
}

// ============================================
// INITIALIZATION
// ============================================

// Initialize app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Also initialize if DOM already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    if (!window.app) {
        window.app = new App();
    }
}

// Handle errors globally
window.addEventListener('error', (e) => {
    console.error('❌ Global Error:', e.error || e.message);
    // Show error toast
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = '⚠️ कुछ गड़बड़ हुई। कृपया पेज रिफ्रेश करें।';
        toast.style.background = '#C62828';
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
            toast.style.background = '#333';
        }, 5000);
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
    console.error('❌ Unhandled Promise Rejection:', e.reason);
});

// ============================================
// ALTERNATING BADGE - Free Delivery (9s) ↔ Trust (3s)
// ============================================
(function() {
    const deliveryContent = document.getElementById('deliveryContent');
    const trustContent = document.getElementById('trustContent');
    const deliveryText = deliveryContent?.querySelector('.badge-text');
    const trustText = trustContent?.querySelector('.badge-text');

    if (!deliveryContent || !trustContent) return;

    let showingDelivery = true;
    let switchTimeout;
    let isPaused = false;
    const DELIVERY_DURATION = 9000;  // 9 seconds
    const TRUST_DURATION = 3000;      // 3 seconds

    function switchToTrust() {
        if (isPaused) return;
        
        deliveryContent.classList.remove('visible');
        deliveryContent.classList.add('hidden');
        trustContent.classList.remove('hidden');
        trustContent.classList.add('visible');
        showingDelivery = false;

        // Schedule switch back to delivery after 3s
        switchTimeout = setTimeout(switchToDelivery, TRUST_DURATION);
    }

    function switchToDelivery() {
        if (isPaused) return;
        
        trustContent.classList.remove('visible');
        trustContent.classList.add('hidden');
        deliveryContent.classList.remove('hidden');
        deliveryContent.classList.add('visible');
        showingDelivery = true;

        // Schedule switch to trust after 9s
        switchTimeout = setTimeout(switchToTrust, DELIVERY_DURATION);
    }

    function startSwitching() {
        if (switchTimeout) {
            clearTimeout(switchTimeout);
            switchTimeout = null;
        }
        isPaused = false;
        
        // Reset to delivery
        trustContent.classList.add('hidden');
        trustContent.classList.remove('visible');
        deliveryContent.classList.add('visible');
        deliveryContent.classList.remove('hidden');
        showingDelivery = true;
        switchTimeout = setTimeout(switchToTrust, DELIVERY_DURATION);
    }

    function stopSwitching() {
        isPaused = true;
        if (switchTimeout) {
            clearTimeout(switchTimeout);
            switchTimeout = null;
        }
    }

    // Start
    startSwitching();

    // Language change handler
    document.addEventListener('languageChanged', function(e) {
        const lang = e.detail?.language || 'hi';

        if (deliveryText && trustText) {
            if (lang === 'en') {
                deliveryText.textContent = 'Free Delivery';
                trustText.textContent = 'Verified';
            } else {
                deliveryText.textContent = 'फ्री डिलीवरी';
                trustText.textContent = 'Verified';
            }
        }

        startSwitching();
    });

    // Pause when tab not visible
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            stopSwitching();
        } else {
            startSwitching();
        }
    });

    // Export controls for debugging
    window.badgeControl = {
        start: startSwitching,
        stop: stopSwitching,
        isPaused: () => isPaused
    };
})();

// ============================================
// PERFORMANCE METRICS
// ============================================
(function() {
    // Report page load time
    if (window.performance) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`⏱️ Page Load Time: ${pageLoadTime}ms`);
        
        // Log to analytics if available
        if (window.gtag) {
            window.gtag('event', 'page_load', {
                'event_category': 'performance',
                'value': pageLoadTime
            });
        }
    }
})();

console.log('📱 Quick Dukan App Loaded Successfully!');