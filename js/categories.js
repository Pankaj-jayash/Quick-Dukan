// ========== CATEGORIES MANAGEMENT ==========

const Categories = {
    currentCategory: null,
    
    async render() {
        const container = document.getElementById('categoriesScroll');
        const indicator = document.getElementById('scrollIndicator');
        if (!container) return;
        
        const categories = await ProductLoader.loadCategoriesList();
        
        // Render categories
        container.innerHTML = categories.map(cat => `
            <div class="category-item ${cat.priority ? 'priority' : ''} ${this.currentCategory === cat.id ? 'active' : ''}" 
                 data-category="${cat.id}"
                 onclick="Categories.select('${cat.id}')">
                <span class="category-icon">${cat.icon}</span>
                <span class="category-name">${cat.name}</span>
                ${cat.priority ? '<span class="priority-badge">🔥</span>' : ''}
            </div>
        `).join('');
        
        // Render scroll indicator
        if (indicator) {
            const totalDots = Math.min(categories.length, 5);
            indicator.innerHTML = Array.from({ length: totalDots }, (_, i) => 
                `<span class="scroll-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`
            ).join('');
        }
        
        this.setupScroll();
    },
    
    setupScroll() {
        const scrollContainer = document.getElementById('categoriesScroll');
        const leftArrow = document.getElementById('catScrollLeft');
        const rightArrow = document.getElementById('catScrollRight');
        
        if (!scrollContainer) return;
        
        // Arrow clicks
        if (leftArrow) {
            leftArrow.addEventListener('click', () => {
                scrollContainer.scrollBy({ left: -150, behavior: 'smooth' });
            });
        }
        
        if (rightArrow) {
            rightArrow.addEventListener('click', () => {
                scrollContainer.scrollBy({ left: 150, behavior: 'smooth' });
            });
        }
        
        // Update scroll indicator
        scrollContainer.addEventListener('scroll', Utils.debounce(() => {
            const scrollLeft = scrollContainer.scrollLeft;
            const scrollWidth = scrollContainer.scrollWidth - scrollContainer.clientWidth;
            const progress = scrollWidth > 0 ? scrollLeft / scrollWidth : 0;
            
            document.querySelectorAll('.scroll-dot').forEach((dot, i) => {
                const dotProgress = i / (document.querySelectorAll('.scroll-dot').length - 1);
                dot.classList.toggle('active', Math.abs(progress - dotProgress) < 0.15);
            });
        }, 50));
    },
    
    async select(categoryId) {
        this.currentCategory = categoryId;
        
        // Update category items active state
        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.toggle('active', item.dataset.category === categoryId);
        });
        
        // Show category products
        const recentSection = document.getElementById('recentlySection');
        const categorySection = document.getElementById('categoryProductsSection');
        const categoryTitle = document.getElementById('categoryProductsTitle');
        const categoryGrid = document.getElementById('categoryProductsGrid');
        
        if (recentSection) recentSection.style.display = 'none';
        if (categorySection) categorySection.style.display = 'block';
        
        // Load and render products
        const data = await ProductLoader.loadCategoryProducts(categoryId);
        const categories = await ProductLoader.loadCategoriesList();
        const cat = categories.find(c => c.id === categoryId);
        
        if (categoryTitle && cat) {
            categoryTitle.textContent = `${cat.icon} ${cat.name} (${data.products.filter(p => p.inStock).length} products)`;
        }
        
        if (categoryGrid) {
            categoryGrid.innerHTML = data.products
                .filter(p => p.inStock)
                .map(p => ProductLoader.renderProductCard({ ...p, category: categoryId }))
                .join('');
        }
        
        // Scroll to category products
        if (categorySection) {
            categorySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },
    
    deselect() {
        this.currentCategory = null;
        
        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const categorySection = document.getElementById('categoryProductsSection');
        if (categorySection) categorySection.style.display = 'none';
        
        // Show recent if exists
        const recent = Storage.getRecent();
        const recentSection = document.getElementById('recentlySection');
        if (recentSection && recent.length > 0) {
            recentSection.style.display = 'block';
        }
    }
};