var Products = {
    allProducts: [],
    mostOrderedProducts: [],
    
    async init() {
        UI.showLoading();
        await this.loadAllProducts();
        await this.loadMostOrdered();
        UI.hideLoading();
        UI.renderRecentlyViewed();
    },
    
    async loadAllProducts() {
        try {
            var response = await fetch(CONFIG.urls.categoriesList);
            if (!response.ok) throw new Error('Failed');
            var data = await response.json();
            var categories = data.categories;
            this.allProducts = [];
            
            for (var i = 0; i < categories.length; i++) {
                var cat = categories[i];
                try {
                    var catResponse = await fetch(cat.file);
                    if (!catResponse.ok) continue;
                    var catData = await catResponse.json();
                    var products = catData.products.filter(function(p) { return p.inStock; });
                    this.allProducts = this.allProducts.concat(products);
                } catch (e) {
                    console.warn('Skip:', cat.name);
                }
            }
            
            if (this.allProducts.length === 0) {
                this.allProducts = this.getFallbackProducts();
            }
        } catch (error) {
            console.error('Load error:', error);
            this.allProducts = this.getFallbackProducts();
        }
    },
    
    async loadMostOrdered() {
        if (this.allProducts.length === 0) await this.loadAllProducts();
        this.mostOrderedProducts = this.allProducts.filter(function(p) { return p.mostOrdered; }).slice(0, 12);
        if (this.mostOrderedProducts.length === 0) this.mostOrderedProducts = this.allProducts.slice(0, 8);
        this.renderProductCards(this.mostOrderedProducts, 'productsGrid');
        var section = document.getElementById('mostOrderedSection');
        if (section) section.style.display = 'block';
    },
    
    async loadCategoryProducts(categoryId) {
        UI.showLoading();
        try {
            var cat = Categories.categoriesList.find(function(c) { return c.id === categoryId; });
            if (!cat) throw new Error('Not found');
            var response = await fetch(cat.file);
            var data = await response.json();
            var products = data.products.filter(function(p) { return p.inStock; });
            UI.hideLoading();
            return products;
        } catch (error) {
            UI.hideLoading();
            return this.allProducts.filter(function(p) { return p.category === categoryId; }).slice(0, 8);
        }
    },
    
    searchProducts(query) {
        if (this.allProducts.length === 0) return [];
        var q = query.toLowerCase();
        return this.allProducts.filter(function(p) {
            return p.name.toLowerCase().indexOf(q) > -1 || (p.weight && p.weight.toLowerCase().indexOf(q) > -1);
        }).slice(0, CONFIG.search.maxSuggestions);
    },
    
    renderProductCards(products, containerId) {
        var container = document.getElementById(containerId);
        if (!container) return;
        if (!products || products.length === 0) {
            container.innerHTML = '<div class="empty-products-message"><span style="font-size:48px;">📦</span><p>Products coming soon!</p></div>';
            return;
        }
        
        container.innerHTML = products.map(function(product) {
            return createProductCardHTML(product);
        }).join('');
        
        // Add to Cart
        var addBtns = container.querySelectorAll('.card-add-btn');
        for (var i = 0; i < addBtns.length; i++) {
            addBtns[i].addEventListener('click', function(e) {
                e.stopPropagation();
                var id = this.getAttribute('data-product-id');
                var product = products.find(function(p) { return p.id === id; });
                if (product) {
                    Cart.addItem(product, 1);
                    UI.showCartToast(product.name);
                    UI.addToRecentlyViewed(product);
                }
            });
        }
        
        // Buy Now
        var buyBtns = container.querySelectorAll('.card-buy-btn');
        for (var j = 0; j < buyBtns.length; j++) {
            buyBtns[j].addEventListener('click', function(e) {
                e.stopPropagation();
                var id = this.getAttribute('data-product-id');
                var product = products.find(function(p) { return p.id === id; });
                if (product && typeof CheckoutModal !== 'undefined') {
                    CheckoutModal.open(product);
                }
            });
        }
        
        // Card click
        var cards = container.querySelectorAll('.product-card');
        for (var k = 0; k < cards.length; k++) {
            cards[k].addEventListener('click', function() {
                var id = this.getAttribute('data-product-id');
                var product = products.find(function(p) { return p.id === id; });
                if (product && UI && UI.addToRecentlyViewed) UI.addToRecentlyViewed(product);
                window.location.href = 'product.html?id=' + id;
            });
        }
    },
    
    getFallbackProducts() {
        return [
            { id: 'fb-001', name: 'Maggi Noodles', weight: '4-Pack', price: 55, mrp: 60, image: '', icon: '🍜', rating: 4.7, reviews: 500, badge: 'popular', inStock: true, mostOrdered: true, category: 'biscuit-namkeen' },
            { id: 'fb-002', name: 'Parle-G Biscuit', weight: '800g', price: 65, mrp: 70, image: '', icon: '🍪', rating: 4.8, reviews: 250, badge: 'best-seller', inStock: true, mostOrdered: true, category: 'biscuit-namkeen' },
            { id: 'fb-003', name: 'Coca Cola', weight: '750ml', price: 40, mrp: 45, image: '', icon: '🥤', rating: 4.4, reviews: 400, badge: 'popular', inStock: true, mostOrdered: true, category: 'cold-drinks' },
            { id: 'fb-004', name: 'Tata Atta', weight: '5kg', price: 300, mrp: 350, image: '', icon: '🍚', rating: 4.2, reviews: 120, badge: null, inStock: true, mostOrdered: true, category: 'atta-rice' },
            { id: 'fb-005', name: 'Surf Excel', weight: '1kg', price: 180, mrp: 220, image: '', icon: '🧴', rating: 4.3, reviews: 89, badge: 'discount', inStock: true, mostOrdered: true, category: 'soap-shampoo' },
            { id: 'fb-006', name: 'Fortune Oil', weight: '1L', price: 165, mrp: 180, image: '', icon: '🧂', rating: 4.1, reviews: 65, badge: null, inStock: true, mostOrdered: true, category: 'masale-oil' },
            { id: 'fb-007', name: 'Amul Doodh', weight: '500ml', price: 25, mrp: 28, image: '', icon: '🥛', rating: 4.6, reviews: 200, badge: null, inStock: true, mostOrdered: true, category: 'dairy-bread' },
            { id: 'fb-008', name: 'Taj Chai', weight: '250g', price: 130, mrp: 150, image: '', icon: '☕', rating: 4.4, reviews: 78, badge: null, inStock: true, mostOrdered: true, category: 'tea-coffee' }
        ];
    }
};

function createProductCardHTML(product) {
    var badgeHTML = '';
    if (product.badge) {
        var badgeText = '';
        if (product.badge === 'best-seller') badgeText = '🏆 Best';
        else if (product.badge === 'popular') badgeText = '🔥 Popular';
        else if (product.badge === 'new') badgeText = '✨ New';
        else if (product.badge === 'discount') {
            var d = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
            badgeText = d + '% OFF';
        }
        badgeHTML = '<span class="card-badge ' + product.badge + '">' + badgeText + '</span>';
    }
    
    var imageHTML;
    if (product.image && product.image.indexOf('http') === 0) {
        imageHTML = '<img src="' + product.image + '" alt="' + product.name + '" class="card-image" loading="lazy" onerror="this.parentElement.innerHTML=\'<div class=card-image-placeholder>' + (product.icon || '📦') + '</div>\'">';
    } else {
        imageHTML = '<div class="card-image-placeholder">' + (product.icon || '📦') + '</div>';
    }
    
    var discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
    var ratingHTML = '';
    if (product.rating) {
        ratingHTML = '<div class="card-rating"><span class="card-rating-stars">' + '⭐'.repeat(Math.round(product.rating)) + '</span><span>' + product.rating + ' (' + (product.reviews || 0) + ')</span></div>';
    }
    
    return '<div class="product-card" data-product-id="' + product.id + '">' +
        '<div class="card-image-wrapper">' + badgeHTML + imageHTML + '<div class="card-price-overlay">₹' + product.price + '</div></div>' +
        '<div class="card-info">' +
        '<div class="card-name">' + product.name + '</div>' +
        '<div class="card-weight">' + (product.weight || '') + '</div>' +
        ratingHTML +
        '<div class="card-bottom"><div><span class="card-price">₹' + product.price + '</span>' +
        (product.mrp ? '<span class="card-mrp">₹' + product.mrp + '</span>' : '') +
        (discount > 0 ? '<span style="font-size:10px;color:#E85D75;font-weight:600;">' + discount + '% OFF</span>' : '') +
        '</div><div style="display:flex;gap:4px;"><button class="card-add-btn" data-product-id="' + product.id + '">🛒 Add</button><button class="card-buy-btn" data-product-id="' + product.id + '">⚡ Buy</button></div></div></div></div>';
}

console.log('✅ Quick Dukan — Products Loader Ready (v2)');