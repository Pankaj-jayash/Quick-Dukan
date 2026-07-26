// ============================================
// CATEGORY-PRODUCTS.JS - Section 5: Category Products
// ============================================

class CategoryProductsManager {
    constructor() {
        this.section = document.getElementById('categoryProductsSection');
        this.title = document.getElementById('categoryProductsTitle');
        this.grid = document.getElementById('categoryProductsGrid');
        this.currentCategoryId = null;
        
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
    }
    
    showCategoryProducts(categoryId, silent = false) {
        if (categoryId === 'all') {
            this.hide();
            return;
        }
        
        if (!window.dataLoader || !window.dataLoader.isLoaded) return;
        
        const products = window.dataLoader.getProductsByCategory(categoryId);
        
        if (products.length === 0) {
            this.hide();
            return;
        }
        
        this.currentCategoryId = categoryId;
        
        // Find category name
        const category = window.dataLoader.categories.find(c => c.id === categoryId);
        const lang = window.languageManager?.currentLang || 'hi';
        const catName = category 
            ? (lang === 'hi' ? (category.nameHi || category.name) : (category.nameEn || category.name))
            : categoryId;
        
        // Update title
        this.title.textContent = `📂 ${catName}`;
        
        // Render products
        this.grid.innerHTML = '';
        products.forEach(product => {
            const card = window.productsManager.createProductCard(product);
            this.grid.appendChild(card);
        });
        
        // Show section FIRST
        this.section.classList.remove('hidden');
        
        // Update other sections visibility
        this.updateOtherSections(true);
        
        if (!silent) {
            // Small delay to ensure DOM is updated
            setTimeout(() => {
                // Scroll the category products section to top of main content
                const mainContent = document.getElementById('mainContent');
                const sectionTitle = this.section.querySelector('.section-title');
                
                if (mainContent && sectionTitle) {
                    // Calculate scroll position to show section just below categories
                    const sectionTop = this.section.offsetTop;
                    mainContent.scrollTo({
                        top: sectionTop - 8,
                        behavior: 'smooth'
                    });
                }
            }, 100);
        }
    }
    
    hide() {
        this.section.classList.add('hidden');
        this.currentCategoryId = null;
        this.grid.innerHTML = '';
        
        // Update other sections visibility
        this.updateOtherSections(false);
        
        // Scroll main content to top
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
            mainContent.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }
    
    updateOtherSections(isCategoryActive) {
        const recentlyViewedSection = document.getElementById('recentlyViewedSection');
        const mostOrdersSection = document.getElementById('mostOrdersSection');
        const allProductsSection = document.getElementById('allProductsSection');
        
        if (isCategoryActive) {
            // When category is active: hide recently viewed and all products
            // Show most orders below category products
            if (recentlyViewedSection) recentlyViewedSection.classList.add('hidden');
            if (mostOrdersSection) mostOrdersSection.classList.remove('hidden');
            if (allProductsSection) allProductsSection.classList.add('hidden');
        } else {
            // When no category: restore all
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