'use strict';

// ============================================
// CATEGORIES.JS - Categories With Auto-Scroll
// Push/Pull Animation + Smart Behavior (FIXED)
// ============================================

class CategoriesManager {
    constructor() {
        this.categoriesScroll = document.getElementById('categoriesScroll');
        this.categoriesSection = document.getElementById('categoriesSection');
        this.scrollLeft = document.getElementById('scrollLeft');
        this.scrollRight = document.getElementById('scrollRight');
        this.activeCategory = 'all';
        
        // Auto-scroll settings
        this.autoScrollInterval = null;
        this.autoScrollDelay = 6000;        // 6 sec after page load
        this.resumeScrollDelay = 5000;      // 5 sec after deselect
        this.scrollSpeed = 1.5;             // pixels per frame
        this.isAutoScrolling = false;
        this.isUserInteracting = false;
        this.resumeTimeout = null;
        this.animationFrameId = null;
        
        // Push/Pull tracking
        this.lastPushedButton = null;
        this.pushPullInterval = null;
        this.pushPullDelay = 1200;          // Har 1.2 sec me push/pull

        this.init();
    }

    init() {
        // Wait for data to load
        document.addEventListener('dataLoaded', (e) => {
            this.renderCategories(e.detail.categories);
            // Start auto-scroll 6 sec after data loads
            this.scheduleAutoScrollStart();
        });

        // Scroll buttons
        this.scrollLeft.addEventListener('click', () => {
            this.stopAutoScroll();
            this.scroll(-250);
        });
        
        this.scrollRight.addEventListener('click', () => {
            this.stopAutoScroll();
            this.scroll(250);
        });

        // Detect manual scroll by user
        this.categoriesScroll.addEventListener('scroll', () => {
            this.updateScrollButtons();
        });

        // Touch/mouse interaction detection
        this.categoriesScroll.addEventListener('touchstart', () => {
            this.isUserInteracting = true;
            this.stopAutoScroll();
        });
        
        this.categoriesScroll.addEventListener('touchend', () => {
            this.isUserInteracting = false;
            this.scheduleResumeScroll();
        });
        
        this.categoriesScroll.addEventListener('mousedown', () => {
            this.isUserInteracting = true;
            this.stopAutoScroll();
        });
        
        this.categoriesScroll.addEventListener('mouseup', () => {
            this.isUserInteracting = false;
            this.scheduleResumeScroll();
        });
        
        this.categoriesScroll.addEventListener('mouseleave', () => {
            this.isUserInteracting = false;
            this.scheduleResumeScroll();
        });

        // Initial state
        this.updateScrollButtons();

        // Listen for language changes
        document.addEventListener('languageChanged', (e) => {
            this.updateLanguage(e.detail.language);
        });
    }

    // ============================================
    // AUTO-SCROLL LOGIC
    // ============================================
    scheduleAutoScrollStart() {
        if (this.resumeTimeout) clearTimeout(this.resumeTimeout);
        
        console.log(`Auto-scroll will start in ${this.autoScrollDelay / 1000} seconds`);
        
        setTimeout(() => {
            if (!this.isUserInteracting && this.activeCategory === 'all') {
                this.startAutoScroll();
            }
        }, this.autoScrollDelay);
    }

    startAutoScroll() {
        if (this.isAutoScrolling) return;
        if (this.categoriesScroll.scrollWidth <= this.categoriesScroll.clientWidth) return;
        
        this.isAutoScrolling = true;
        this.categoriesSection.classList.add('auto-scrolling');
        
        console.log('Auto-scroll started');
        
        const scroll = () => {
            if (!this.isAutoScrolling) return;
            
            this.categoriesScroll.scrollLeft += this.scrollSpeed;
            
            if (this.categoriesScroll.scrollLeft + this.categoriesScroll.clientWidth >= 
                this.categoriesScroll.scrollWidth - 5) {
                this.stopAutoScroll();
                setTimeout(() => {
                    this.categoriesScroll.scrollTo({ left: 0, behavior: 'smooth' });
                    setTimeout(() => {
                        if (this.activeCategory === 'all' && !this.isUserInteracting) {
                            this.startAutoScroll();
                        }
                    }, 800);
                }, 1500);
                return;
            }
            
            this.updateScrollButtons();
            this.animationFrameId = requestAnimationFrame(scroll);
        };
        
        this.animationFrameId = requestAnimationFrame(scroll);
        this.startPushPullAnimations();
    }

    stopAutoScroll() {
        this.isAutoScrolling = false;
        this.categoriesSection.classList.remove('auto-scrolling');
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        this.stopPushPullAnimations();
        this.clearAllAnimations();
    }

    scheduleResumeScroll() {
        if (this.resumeTimeout) clearTimeout(this.resumeTimeout);
        
        if (this.activeCategory !== 'all') return;
        if (this.isAutoScrolling) return;
        
        this.resumeTimeout = setTimeout(() => {
            if (!this.isUserInteracting && this.activeCategory === 'all') {
                this.startAutoScroll();
            }
        }, this.resumeScrollDelay);
    }

    // ============================================
    // PUSH/PULL ANIMATIONS
    // ============================================
    startPushPullAnimations() {
        this.stopPushPullAnimations();
        
        this.pushPullInterval = setInterval(() => {
            if (!this.isAutoScrolling) return;
            this.animateRandomButton();
        }, this.pushPullDelay);
    }

    stopPushPullAnimations() {
        if (this.pushPullInterval) {
            clearInterval(this.pushPullInterval);
            this.pushPullInterval = null;
        }
    }

    animateRandomButton() {
        const buttons = Array.from(
            this.categoriesScroll.querySelectorAll('.category-btn:not(.active)')
        );
        
        if (buttons.length === 0) return;
        
        this.clearAllAnimations();
        
        const pushIndex = Math.floor(Math.random() * buttons.length);
        const pushBtn = buttons[pushIndex];
        
        let pullBtn = buttons[pushIndex + 1];
        if (!pullBtn && pushIndex > 0) {
            pullBtn = buttons[pushIndex - 1];
        }
        
        pushBtn.classList.add('pushing');
        pushBtn.classList.add('highlight-push');
        
        setTimeout(() => {
            pushBtn.classList.remove('pushing');
            pushBtn.classList.remove('highlight-push');
        }, 600);
        
        if (pullBtn) {
            setTimeout(() => {
                pullBtn.classList.add('pulling');
                setTimeout(() => {
                    pullBtn.classList.remove('pulling');
                }, 600);
            }, 200);
        }
        
        this.lastPushedButton = pushBtn;
    }

    clearAllAnimations() {
        const buttons = this.categoriesScroll.querySelectorAll('.category-btn');
        buttons.forEach(btn => {
            btn.classList.remove('pushing', 'pulling', 'hinting', 'highlight-push');
        });
    }

    // ============================================
    // RENDER CATEGORIES
    // ============================================
    renderCategories(categories) {
        const allBtn = this.categoriesScroll.querySelector('[data-category="all"]');
        this.categoriesScroll.innerHTML = '';

        if (allBtn) {
            this.categoriesScroll.appendChild(allBtn);
        } else {
            const btn = this.createCategoryButton({
                id: 'all',
                name: 'All',
                nameHi: 'सब',
                nameEn: 'All',
                icon: '🌟',
                color: '#667eea',
                bgColor: '#f0f0ff'
            });
            btn.classList.add('active');
            this.categoriesScroll.appendChild(btn);
        }

        categories.forEach((cat, index) => {
            const btn = this.createCategoryButton(cat, index);
            this.categoriesScroll.appendChild(btn);
        });

        this.categoriesScroll.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectCategory(btn, e);
            });
        });

        this.updateScrollButtons();
    }

    createCategoryButton(cat, index = 0) {
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.setAttribute('data-category', cat.id);

        const lang = window.languageManager?.currentLang || 'hi';
        const name = lang === 'hi' ? (cat.nameHi || cat.name) : (cat.nameEn || cat.name);
        const icon = cat.icon || '📦';
        const color = cat.color || (window.CONFIG?.categoryColors?.[index % (window.CONFIG?.categoryColors?.length || 1)] || '#666');
        const bgColor = cat.bgColor || '#f5f5f5';

        btn.innerHTML = `
            <span class="category-icon">${icon}</span>
            <span class="category-name">${name}</span>
        `;

        if (cat.id !== 'all') {
            btn.style.background = bgColor;
            btn.style.color = color;
            btn.style.borderColor = color + '30';
        }

        btn.setAttribute('data-name-hi', cat.nameHi || cat.name);
        btn.setAttribute('data-name-en', cat.nameEn || cat.name);
        btn.setAttribute('data-icon', icon);
        btn.setAttribute('data-color', color);
        btn.setAttribute('data-bg-color', bgColor);

        return btn;
    }

    // ============================================
    // 🔧 SELECT CATEGORY - FIXED
    // ============================================
    selectCategory(btn, event) {
        const categoryId = btn.getAttribute('data-category');

        // If selecting same category, deselect it (toggle)
        if (this.activeCategory === categoryId && categoryId !== 'all') {
            this.deselectAll();
            return;
        }

        // If "all" is already selected and clicking "all" again
        if (this.activeCategory === 'all' && categoryId === 'all') {
            return;
        }

        // Remove active from all
        this.categoriesScroll.querySelectorAll('.category-btn').forEach(b => {
            b.classList.remove('active');
            this.resetButtonStyle(b);
        });

        // Add active to selected
        btn.classList.add('active');
        this.activeCategory = categoryId;

        this.applyActiveStyle(btn);

        // Ripple effect
        if (event) {
            this.addRippleEffect(btn, event);
        }

        // 🔧 FIX: Only scroll if NOT "all"
        if (categoryId !== 'all') {
            // Scroll to the selected category button
            btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            // Stop auto-scroll
            this.stopAutoScroll();
            // Add hinting animation to other buttons
            this.showHintingOnOthers(btn);
        } else {
            // 🔧 FIX: "All" selected → DON'T scroll, stay at current position
            this.clearAllAnimations();
            this.updateScrollButtons();
            this.scheduleResumeScroll();
        }

        // Dispatch event
        document.dispatchEvent(new CustomEvent('categoryChanged', {
            detail: { categoryId: this.activeCategory }
        }));
    }

    // ============================================
    // 🔧 DESELECT ALL - FIXED
    // ============================================
    deselectAll() {
        const allBtn = this.categoriesScroll.querySelector('[data-category="all"]');
        if (!allBtn) return;

        // 🔧 FIX: Save current scroll position
        const currentScrollLeft = this.categoriesScroll.scrollLeft;

        // Remove active from all buttons
        this.categoriesScroll.querySelectorAll('.category-btn').forEach(b => {
            b.classList.remove('active');
            this.resetButtonStyle(b);
        });

        // Add active to "All"
        allBtn.classList.add('active');
        this.activeCategory = 'all';

        this.applyActiveStyle(allBtn);

        // 🔧 FIX: Restore scroll position — DON'T jump to start
        requestAnimationFrame(() => {
            this.categoriesScroll.scrollLeft = currentScrollLeft;
            this.updateScrollButtons();
        });

        // Clear hinting
        this.clearAllAnimations();

        // Resume auto-scroll after 5 seconds
        this.scheduleResumeScroll();

        // Dispatch event
        document.dispatchEvent(new CustomEvent('categoryChanged', {
            detail: { categoryId: 'all' }
        }));
    }

    showHintingOnOthers(activeBtn) {
        const buttons = this.categoriesScroll.querySelectorAll('.category-btn:not(.active)');
        buttons.forEach((btn, index) => {
            setTimeout(() => {
                btn.classList.add('hinting');
            }, index * 80);
        });
        
        setTimeout(() => {
            buttons.forEach(btn => btn.classList.remove('hinting'));
        }, 3000);
    }

    applyActiveStyle(btn) {
        const categoryId = btn.getAttribute('data-category');

        if (categoryId === 'all') {
            btn.style.background = 'linear-gradient(135deg, #5a32a3, #6c4fb8)';
            btn.style.color = 'white';
        } else {
            const color = btn.getAttribute('data-color');
            btn.style.background = color;
            btn.style.color = 'white';
            btn.style.borderColor = color;
        }
    }

    resetButtonStyle(btn) {
        const categoryId = btn.getAttribute('data-category');

        if (categoryId === 'all') {
            btn.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
            btn.style.color = 'white';
            btn.style.borderColor = 'transparent';
        } else {
            const bgColor = btn.getAttribute('data-bg-color');
            const color = btn.getAttribute('data-color');
            btn.style.background = bgColor;
            btn.style.color = color;
            btn.style.borderColor = color + '30';
        }
    }

    addRippleEffect(btn, event) {
        const existingRipples = btn.querySelectorAll('.ripple-span');
        existingRipples.forEach(r => r.remove());

        const ripple = document.createElement('span');
        ripple.className = 'ripple-span';

        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        ripple.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
        `;

        btn.appendChild(ripple);

        ripple.addEventListener('animationend', () => {
            ripple.remove();
        });
    }

    scroll(amount) {
        this.categoriesScroll.scrollBy({
            left: amount,
            behavior: 'smooth'
        });
    }

    updateScrollButtons() {
        const { scrollLeft, scrollWidth, clientWidth } = this.categoriesScroll;

        if (scrollLeft <= 3) {
            this.scrollLeft.classList.add('disabled');
        } else {
            this.scrollLeft.classList.remove('disabled');
        }

        if (scrollLeft + clientWidth >= scrollWidth - 3) {
            this.scrollRight.classList.add('disabled');
        } else {
            this.scrollRight.classList.remove('disabled');
        }
    }

    updateLanguage(lang) {
        this.categoriesScroll.querySelectorAll('.category-btn').forEach(btn => {
            if (btn.getAttribute('data-category') === 'all') {
                btn.querySelector('.category-name').textContent = lang === 'hi' ? 'सब' : 'All';
            } else {
                const nameHi = btn.getAttribute('data-name-hi');
                const nameEn = btn.getAttribute('data-name-en');
                btn.querySelector('.category-name').textContent = lang === 'hi' ? nameHi : nameEn;
            }
        });
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.categoriesManager = new CategoriesManager();
});