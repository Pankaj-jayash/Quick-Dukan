// ============================================
// CATEGORIES.JS - Categories Section Logic
// With Icons, Colors, Ripple & Animations
// ============================================

class CategoriesManager {
    constructor() {
        this.categoriesScroll = document.getElementById('categoriesScroll');
        this.scrollLeft = document.getElementById('scrollLeft');
        this.scrollRight = document.getElementById('scrollRight');
        this.activeCategory = 'all';
        
        this.init();
    }
    
    init() {
        // Wait for data to load
        document.addEventListener('dataLoaded', (e) => {
            this.renderCategories(e.detail.categories);
        });
        
        // Scroll buttons
        this.scrollLeft.addEventListener('click', () => this.scroll(-250));
        this.scrollRight.addEventListener('click', () => this.scroll(250));
        
        // Touch scroll detection
        this.categoriesScroll.addEventListener('scroll', () => this.updateScrollButtons());
        
        // Initial scroll button state
        this.updateScrollButtons();
        
        // Listen for language changes
        document.addEventListener('languageChanged', (e) => {
            this.updateLanguage(e.detail.language);
        });
    }
    
    renderCategories(categories) {
        // Keep "All" button and clear rest
        const allBtn = this.categoriesScroll.querySelector('[data-category="all"]');
        this.categoriesScroll.innerHTML = '';
        
        // Re-add "All" button
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
        
        // Add category buttons
        categories.forEach((cat, index) => {
            const btn = this.createCategoryButton(cat, index);
            this.categoriesScroll.appendChild(btn);
        });
        
        // Add click handlers
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
        const color = cat.color || CONFIG.categoryColors[index % CONFIG.categoryColors.length];
        const bgColor = cat.bgColor || '#f5f5f5';
        
        // Set button HTML with icon
        btn.innerHTML = `
            <span class="category-icon">${icon}</span>
            <span class="category-name">${name}</span>
        `;
        
        // Apply colors (not for "all" button)
        if (cat.id !== 'all') {
            btn.style.background = bgColor;
            btn.style.color = color;
            btn.style.borderColor = color + '30';
        }
        
        // Store data for language switching
        btn.setAttribute('data-name-hi', cat.nameHi || cat.name);
        btn.setAttribute('data-name-en', cat.nameEn || cat.name);
        btn.setAttribute('data-icon', icon);
        btn.setAttribute('data-color', color);
        btn.setAttribute('data-bg-color', bgColor);
        
        return btn;
    }
    
    selectCategory(btn, event) {
        const categoryId = btn.getAttribute('data-category');
        
        // If same category, do nothing
        if (this.activeCategory === categoryId) return;
        
        // Remove active from all buttons
        this.categoriesScroll.querySelectorAll('.category-btn').forEach(b => {
            b.classList.remove('active');
            this.resetButtonStyle(b);
        });
        
        // Add active to selected
        btn.classList.add('active');
        this.activeCategory = categoryId;
        
        // Apply active style
        this.applyActiveStyle(btn);
        
        // Ripple effect on click
        if (event) {
            this.addRippleEffect(btn, event);
        }
        
        // Smooth scroll to button
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('categoryChanged', {
            detail: { categoryId: this.activeCategory }
        }));
    }
    
    applyActiveStyle(btn) {
        const categoryId = btn.getAttribute('data-category');
        
        if (categoryId === 'all') {
            // Keep gradient style for "all"
            btn.style.background = 'linear-gradient(135deg, #5a32a3, #6c4fb8)';
            btn.style.color = 'white';
        } else {
            const color = btn.getAttribute('data-color');
            // Solid color background when active
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
        // Remove any existing ripples
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
        
        // Left arrow
        if (scrollLeft <= 3) {
            this.scrollLeft.classList.add('disabled');
        } else {
            this.scrollLeft.classList.remove('disabled');
        }
        
        // Right arrow
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