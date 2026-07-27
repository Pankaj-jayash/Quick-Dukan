'use strict';

// ============================================
// CATEGORY-PRODUCTS.JS - Section 5 (FIXED)
// Category Products with Scroll Preservation
// ============================================

class CategoryProductsManager {
    constructor() {
        this.section = document.getElementById('categoryProductsSection');
        this.title = document.getElementById('categoryProductsTitle');
        this.grid = document.getElementById('categoryProductsGrid');
        this.currentCategoryId = null;
        this.savedMainScrollPosition = 0;  // 🔧 Save scroll position
        
        this.init();
    }
    
    init() {
        document.addEventListener('categoryChanged', (e) => {
            this.showCategoryProducts(e.detail.categoryId);
        });
        
        document.addEventListener('languageChanged', () => {
            if (this.currentCategoryId && this.currentCategoryId !== 'all') {
                this.showCategoryProducts(this.currentCategoryId, true);
            }
        });

        // 🔧 Listen to main content scroll for title effect
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.addEventListener('scroll', () => {
                this.handleMainScroll();
            }, { passive: true });
        }
    }

    // 🔧 Scroll-based title shrink
    handleMainScroll() {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent || !this.section || this.section.classList.contains('hidden')) return;
        
        const sectionTop = this.section.offsetTop;
        const scrollTop = mainContent.scrollTop;
        
        if (scrollTop > sectionTop + 20) {
            this.section.classList.add('scrolled');
        } else {
            this.section.classList.remove('scrolled');
        }
    }
    
    showCategoryProducts(categoryId, silent = false) {
        if (categoryId === 'all') {
            this.hide();
            return;
        }
        
        if (!window.dataLoader || !window.dataLoader.isLoaded) return;
        
        const products = window.dataLoader.getProductsByCategory(categoryId);
        
        if (!products || products.length === 0) {
            this.showEmptyState(categoryId);
            return;
        }
        
        this.currentCategoryId = categoryId;
        
        // Find category name
        const category = window.dataLoader.categories.find(c => c.id === categoryId);
        const lang = window.languageManager?.currentLang || 'hi';
        const catName = category 
            ? (lang === 'hi' ? (category.nameHi || category.name) : (category.nameEn || category.name))
            : categoryId;
        
        // Update title with icon from category
        const catIcon = category?.icon || '📂';
        this.title.innerHTML = `<span>${catIcon}</span> ${catName}`;
        
        // Render products with staggered animation
        this.grid.innerHTML = '';
        products.forEach((product, index) => {
            const card = window.productsManager.createProductCard(product);
            card.style.animationDelay = `${index * 0.04}s`;
            this.grid.appendChild(card);
        });
        
        // Show section
        this.section.classList.remove('hidden');
        
        // Update other sections
        this.updateOtherSections(true);
        
        if (!silent) {
            // 🔧 Scroll to section smoothly
            setTimeout(() => {
                this.scrollToSection();
            }, 100);
        }

        // 🔧 Reset scrolled state
        this.section.classList.remove('scrolled');
    }
    
    showEmptyState(categoryId) {
        this.currentCategoryId = categoryId;
        
        const category = window.dataLoader?.categories?.find(c => c.id === categoryId);
        const lang = window.languageManager?.currentLang || 'hi';
        const catName = category 
            ? (lang === 'hi' ? (category.nameHi || category.name) : (category.nameEn || category.name))
            : categoryId;
        
        this.title.innerHTML = `<span>📂</span> ${catName}`;
        
        this.grid.innerHTML = `
            <div class="category-products-empty">
                <span class="empty-icon">📭</span>
                <p class="empty-text">${lang === 'hi' ? 'इस कैटेगरी में अभी कोई प्रोडक्ट नहीं है' : 'No products in this category yet'}</p>
            </div>
        `;
        
        this.section.classList.remove('hidden');
        this.updateOtherSections(true);
        
        setTimeout(() => {
            this.scrollToSection();
        }, 100);
    }

    // 🔧 Scroll to section without hiding other content
    scrollToSection() {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent || !this.section) return;
        
        // Use scrollIntoView on the section
        this.section.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    }
    
    hide() {
        // 🔧 Save current scroll position before hiding
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            this.savedMainScrollPosition = mainContent.scrollTop;
        }

        this.section.classList.add('hidden');
        this.currentCategoryId = null;
        this.grid.innerHTML = '';
        
        // Update other sections
        this.updateOtherSections(false);
        
        // 🔧 Restore scroll position
        if (mainContent) {
            requestAnimationFrame(() => {
                mainContent.scrollTop = this.savedMainScrollPosition;
            });
        }

        this.section.classList.remove('scrolled');
    }
    
    updateOtherSections(isCategoryActive) {
        const recentlyViewedSection = document.getElementById('recentlyViewedSection');
        const mostOrdersSection = document.getElementById('mostOrdersSection');
        const allProductsSection = document.getElementById('allProductsSection');
        
        if (isCategoryActive) {
            if (recentlyViewedSection) recentlyViewedSection.classList.add('hidden');
            if (mostOrdersSection) mostOrdersSection.classList.remove('hidden');
            if (allProductsSection) allProductsSection.classList.add('hidden');
        } else {
            if (allProductsSection) allProductsSection.classList.remove('hidden');
            this.restoreDefaultVisibility();
        }
    }
    
    restoreDefaultVisibility() {
        if (window.recentlyViewedManager) {
            window.recentlyViewedManager.checkAndShow();
        }
        if (window.mostOrdersManager) {
            window.mostOrdersManager.checkAndShow();
        }
        const allProductsSection = document.getElementById('allProductsSection');
        if (allProductsSection) {
            allProductsSection.classList.remove('hidden');
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.categoryProductsManager = new CategoryProductsManager();
});