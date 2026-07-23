var Categories = {
    categoriesList: [],
    selectedCategory: null,
    
    init: function() {
        this.loadCategories();
    },
    
    loadCategories: function() {
        var self = this;
        fetch(CONFIG.urls.categoriesList)
            .then(function(res) { return res.json(); })
            .then(function(data) {
                self.categoriesList = data.categories.sort(function(a, b) { return a.order - b.order; });
                self.renderBar();
            })
            .catch(function() {
                self.categoriesList = self.getFallback();
                self.renderBar();
            });
    },
    
    getFallback: function() {
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
    
    renderBar: function() {
        var container = document.getElementById('categoriesBar');
        if (!container) return;
        var self = this;
        container.innerHTML = this.categoriesList.map(function(cat) {
            var dot = cat.priority ? '<span class="pill-priority-dot"></span>' : '';
            var sel = self.selectedCategory === cat.id ? ' selected' : '';
            return '<div class="category-pill' + sel + '" data-category="' + cat.id + '" onclick="Categories.selectCategory(\'' + cat.id + '\')">' + dot + '<span class="pill-icon">' + cat.icon + '</span><span class="pill-name">' + cat.name + '</span><span class="pill-count">' + cat.count + '</span></div>';
        }).join('');
    },
    
    selectCategory: function(categoryId) {
    if (this.selectedCategory === categoryId) {
        this.deselectAll();
        return;
    }
    
    this.deselectAll();
    this.selectedCategory = categoryId;
    
    var pill = document.querySelector('.category-pill[data-category="' + categoryId + '"]');
    if (pill) pill.classList.add('selected');
    
    this.showCategoryProducts(categoryId);
    
    // 👁️ Recently Viewed ko HIDE karo
    var recentSection = document.getElementById('recentlyViewedSection');
    if (recentSection) {
        recentSection.style.display = 'none';
    }
},
    
    deselectAll: function() {
    var pills = document.querySelectorAll('.category-pill.selected');
    for (var i = 0; i < pills.length; i++) {
        pills[i].classList.remove('selected');
    }
    
    this.selectedCategory = null;
    this.showMostOrdered();
    
    // 👁️ Recently Viewed ko WAPAS SHOW karo
    var recentSection = document.getElementById('recentlyViewedSection');
    if (recentSection && typeof UI !== 'undefined') {
        UI.renderRecentlyViewed();
    }
},
    
    showCategoryProducts: function(categoryId) {
        var cat = this.categoriesList.find(function(c) { return c.id === categoryId; });
        if (!cat) return;
        document.getElementById('mostOrderedSection').style.display = 'none';
        document.getElementById('categoryBack').style.display = 'block';
        document.getElementById('categoryTitle').style.display = 'block';
        document.getElementById('categoryTitle').textContent = cat.icon + ' ' + cat.name + ' (' + cat.count + ' products)';
        document.getElementById('categoryProductsSection').style.display = 'block';
        Products.loadCategoryProducts(categoryId).then(function(products) {
            Products.renderProductCards(products, 'categoryProductsGrid');
        });
    },
    
    showMostOrdered: function() {
        document.getElementById('mostOrderedSection').style.display = 'block';
        document.getElementById('categoryBack').style.display = 'none';
        document.getElementById('categoryTitle').style.display = 'none';
        document.getElementById('categoryProductsSection').style.display = 'none';
    }
};