const Categories = {
    categoriesList: [],
    selectedCategory: null,
    
    async init() {
        await this.loadCategories();
        this.renderCategoriesBar();
        this.setupScroll();
        this.setupFadeEdges();
    },
    
    async loadCategories() {
        try {
            const response = await fetch(CONFIG.urls.categoriesList);
            const data = await response.json();
            this.categoriesList = data.categories.sort((a, b) => a.order - b.order);
        } catch (error) {
            console.error('Failed to load categories:', error);
            this.categoriesList = this.getFallbackCategories();
        }
    },
    
    getFallbackCategories() {
        return [
            { id: 'biscuit-namkeen', name: 'Biscuit & Namkeen', icon: '🍪', count: 35, priority: true, order: 1, file: 'data/products/biscuit-namkeen.json' },
            { id: 'cold-drinks', name: 'Cold Drinks', icon: '🥤', count: 15, priority: false, order: 2, file: 'data/products/cold-drinks.json' },
            { id: 'atta-rice', name: 'Atta & Rice', icon: '🍚', count: 30, priority: true, order: 3, file: 'data/products/atta-rice.json' },
            { id: 'soap-shampoo', name: 'Soap & Shampoo', icon: '🧴', count: 25, priority: true, order: 4, file: 'data/products/soap-shampoo.json' },
            { id: 'masale-oil', name: 'Masale & Oil', icon: '🧂', count: 40, priority: true, order: 5, file: 'data/products/masale-oil.json' },
            { id: 'dairy-bread', name: 'Dairy & Bread', icon: '🥛', count: 20, priority: false, order: 6, file: 'data/products/dairy-bread.json' },
            { id: 'cleaning', name: 'Cleaning Items', icon: '🧹', count: 20, priority: false, order: 7, file: 'data/products/cleaning.json' },
            { id: 'ghee-paneer', name: 'Ghee & Paneer', icon: '🐄', count: 10, priority: false, order: 8, file: 'data/products/ghee-paneer.json' },
            { id: 'tea-coffee', name: 'Tea & Coffee', icon: '☕', count: 15, priority: false, order: 9, file: 'data/products/tea-coffee.json' },
            { id: 'sweets-snacks', name: 'Sweets & Snacks', icon: '🍬', count: 25, priority: false, order: 10, file: 'data/products/sweets-snacks.json' }
        ];
    },
    
    renderCategoriesBar() {
        const container = document.getElementById('categoriesBar');
        if (!container) return;
        
        container.innerHTML = this.categoriesList.map(cat => `
            <div class="category-pill ${this.selectedCategory === cat.id ? 'selected' : ''}" 
                 data-category="${cat.id}"
                 onclick="Categories.selectCategory('${cat.id}')">
                ${cat.priority ? '<span class="pill-priority-dot"></span>' : ''}
                <span class="pill-icon">${cat.icon}</span>
                <span class="pill-name">${cat.name}</span>
                <span class="pill-count">${cat.count}</span>
            </div>
        `).join('');
        
        this.renderDots();
    },
    
    selectCategory(categoryId) {
        if (this.selectedCategory === categoryId) {
            this.deselectAll();
            return;
        }
        
        this.deselectAll();
        this.selectedCategory = categoryId;
        
        const pill = document.querySelector(`.category-pill[data-category="${categoryId}"]`);
        if (pill) pill.classList.add('selected');
        
        this.showCategoryProducts(categoryId);
    },
    
    deselectAll() {
        document.querySelectorAll('.category-pill.selected').forEach(p => p.classList.remove('selected'));
        this.selectedCategory = null;
        this.showMostOrdered();
    },
    
    async showCategoryProducts(categoryId) {
        const cat = this.categoriesList.find(c => c.id === categoryId);
        if (!cat) return;
        
        document.getElementById('mostOrderedSection').style.display = 'none';
        document.getElementById('categoryBack').style.display = 'block';
        document.getElementById('categoryTitle').style.display = 'block';
        document.getElementById('categoryTitle').textContent = `${cat.icon} ${cat.name} (${cat.count} products)`;
        document.getElementById('categoryProductsSection').style.display = 'block';
        
        // Load products
        const products = await Products.loadCategoryProducts(categoryId);
        Products.renderProductCards(products, 'categoryProductsGrid');
    },
    
    async showMostOrdered() {
        document.getElementById('mostOrderedSection').style.display = 'block';
        document.getElementById('categoryBack').style.display = 'none';
        document.getElementById('categoryTitle').style.display = 'none';
        document.getElementById('categoryProductsSection').style.display = 'none';
        
        // Load most ordered
        await Products.loadMostOrdered();
    },
    
    setupScroll() {
        const bar = document.getElementById('categoriesBar');
        const leftBtn = document.getElementById('catScrollLeft');
        const rightBtn = document.getElementById('catScrollRight');
        if (!bar) return;
        
        if (leftBtn) leftBtn.addEventListener('click', () => { bar.scrollBy({ left: -200, behavior: 'smooth' }); });
        if (rightBtn) rightBtn.addEventListener('click', () => { bar.scrollBy({ left: 200, behavior: 'smooth' }); });
        
        bar.addEventListener('scroll', () => { this.updateDots(); this.updateArrowVisibility(); });
        this.updateArrowVisibility();
    },
    
    updateArrowVisibility() {
        const bar = document.getElementById('categoriesBar');
        const leftBtn = document.getElementById('catScrollLeft');
        const rightBtn = document.getElementById('catScrollRight');
        if (!bar || !leftBtn || !rightBtn) return;
        
        leftBtn.style.opacity = bar.scrollLeft <= 5 ? '0.3' : '1';
        rightBtn.style.opacity = bar.scrollLeft + bar.clientWidth >= bar.scrollWidth - 5 ? '0.3' : '1';
    },
    
    renderDots() {
        const container = document.getElementById('catScrollDots');
        if (!container) return;
        const totalDots = Math.ceil(this.categoriesList.length / 5);
        container.innerHTML = Array.from({ length: totalDots }, (_, i) => 
            `<span class="cat-dot ${i === 0 ? 'active' : ''}" data-dot="${i}"></span>`
        ).join('');
    },
    
    updateDots() {
        const bar = document.getElementById('categoriesBar');
        const dots = document.querySelectorAll('.cat-dot');
        if (!bar || dots.length === 0) return;
        
        const scrollPercent = bar.scrollLeft / (bar.scrollWidth - bar.clientWidth);
        const activeIndex = Math.round(scrollPercent * (dots.length - 1));
        
        dots.forEach((dot, i) => dot.classList.toggle('active', i === activeIndex));
    },
    
    setupFadeEdges() {
        const bar = document.getElementById('categoriesBar');
        const fadeLeft = document.querySelector('.cat-fade-left');
        const fadeRight = document.querySelector('.cat-fade-right');
        if (!bar) return;
        
        const updateFade = () => {
            if (fadeLeft) fadeLeft.style.opacity = bar.scrollLeft > 5 ? '1' : '0';
            if (fadeRight) fadeRight.style.opacity = bar.scrollLeft + bar.clientWidth < bar.scrollWidth - 5 ? '1' : '0';
        };
        
        bar.addEventListener('scroll', updateFade);
        updateFade();
    }
};
console.log('✅ Quick Dukan — Categories Manager Loaded');