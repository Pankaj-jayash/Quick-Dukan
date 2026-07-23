var Products = {
    allProducts: [],
    
    init: function() {
        UI.showLoading();
        var self = this;
        this.loadAllProducts().then(function() {
            self.loadMostOrdered();
            UI.hideLoading();
            UI.renderRecentlyViewed();
        });
    },
    
    loadAllProducts: function() {
        var self = this;
        return fetch(CONFIG.urls.categoriesList)
            .then(function(res) { return res.json(); })
            .then(function(data) {
                var promises = data.categories.map(function(cat) {
                    return fetch(cat.file).then(function(r) { return r.json(); }).catch(function() { return { products: [] }; });
                });
                return Promise.all(promises);
            })
            .then(function(results) {
                self.allProducts = [];
                results.forEach(function(data) {
                    if (data.products) {
                        var active = data.products.filter(function(p) { return p.inStock; });
                        self.allProducts = self.allProducts.concat(active);
                    }
                });
                if (self.allProducts.length === 0) self.allProducts = self.getFallback();
            })
            .catch(function() {
                self.allProducts = self.getFallback();
            });
    },
    
    loadMostOrdered: function() {
        var popular = this.allProducts.filter(function(p) { return p.mostOrdered; }).slice(0, 12);
        if (popular.length === 0) popular = this.allProducts.slice(0, 8);
        this.renderProductCards(popular, 'productsGrid');
        document.getElementById('mostOrderedSection').style.display = 'block';
    },
    
    loadCategoryProducts: function(categoryId) {
        UI.showLoading();
        var cat = Categories.categoriesList.find(function(c) { return c.id === categoryId; });
        if (!cat) return Promise.resolve([]);
        return fetch(cat.file)
            .then(function(res) { return res.json(); })
            .then(function(data) {
                UI.hideLoading();
                return data.products.filter(function(p) { return p.inStock; });
            })
            .catch(function() {
                UI.hideLoading();
                return [];
            });
    },
    
    searchProducts: function(query) {
        var q = query.toLowerCase();
        return this.allProducts.filter(function(p) {
            return p.name.toLowerCase().indexOf(q) > -1;
        }).slice(0, 5);
    },
    
    renderProductCards: function(products, containerId) {
        var container = document.getElementById(containerId);
        if (!container) return;
        if (!products || products.length === 0) {
            container.innerHTML = '<div class="empty-products-message"><span style="font-size:48px;">📦</span><p>Products coming soon!</p></div>';
            return;
        }
        container.innerHTML = products.map(createProductCardHTML).join('');
        
        // Add to Cart buttons
        var addBtns = container.querySelectorAll('.card-add-btn');
        addBtns.forEach(function(btn) {
            btn.onclick = function(e) {
                e.stopPropagation();
                var id = this.getAttribute('data-product-id');
                var product = products.find(function(p) { return p.id === id; });
                if (product) {
                    Cart.addItem(product, 1);
                    UI.showCartToast(product.name);
                    UI.addToRecentlyViewed(product);
                }
            };
        });
        
        // Buy Now buttons
        var buyBtns = container.querySelectorAll('.card-buy-btn');
        buyBtns.forEach(function(btn) {
            btn.onclick = function(e) {
                e.stopPropagation();
                var id = this.getAttribute('data-product-id');
                var product = products.find(function(p) { return p.id === id; });
                if (product && typeof CheckoutModal !== 'undefined') CheckoutModal.open(product);
            };
        });
        
        // Card click
        var cards = container.querySelectorAll('.product-card');
        cards.forEach(function(card) {
            card.onclick = function() {
                var id = this.getAttribute('data-product-id');
                var product = products.find(function(p) { return p.id === id; });
                if (product) UI.addToRecentlyViewed(product);
                window.location.href = 'product.html?id=' + id;
            };
        });
    },
    
    getFallback: function() {
        return [
            { id:'fb1', name:'Maggi Noodles', weight:'4-Pack', price:55, mrp:60, icon:'🍜', rating:4.7, reviews:500, badge:'popular', inStock:true, mostOrdered:true },
            { id:'fb2', name:'Parle-G Biscuit', weight:'800g', price:65, mrp:70, icon:'🍪', rating:4.8, reviews:250, badge:'best-seller', inStock:true, mostOrdered:true },
            { id:'fb3', name:'Coca Cola', weight:'750ml', price:40, mrp:45, icon:'🥤', rating:4.4, reviews:400, badge:'popular', inStock:true, mostOrdered:true },
            { id:'fb4', name:'Tata Atta', weight:'5kg', price:300, mrp:350, icon:'🍚', rating:4.2, reviews:120, badge:null, inStock:true, mostOrdered:true },
            { id:'fb5', name:'Surf Excel', weight:'1kg', price:180, mrp:220, icon:'🧴', rating:4.3, reviews:89, badge:'discount', inStock:true, mostOrdered:true },
            { id:'fb6', name:'Fortune Oil', weight:'1L', price:165, mrp:180, icon:'🧂', rating:4.1, reviews:65, badge:null, inStock:true, mostOrdered:true },
            { id:'fb7', name:'Amul Doodh', weight:'500ml', price:25, mrp:28, icon:'🥛', rating:4.6, reviews:200, badge:null, inStock:true, mostOrdered:true },
            { id:'fb8', name:'Taj Chai', weight:'250g', price:130, mrp:150, icon:'☕', rating:4.4, reviews:78, badge:null, inStock:true, mostOrdered:true }
        ];
    }
};

function createProductCardHTML(product) {
    var badgeHTML = '';
    if (product.badge) {
        var badgeText = '';
        if (product.badge === 'best-seller') badgeText = '🏆 Best Seller';
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
    
    var discountRow = '';
    if (discount > 0) {
        discountRow = '<div class="card-discount-row"><span class="card-discount-badge">' + discount + '% OFF</span></div>';
    }
    
    var ratingRow = '';
    if (product.rating) {
        ratingRow = '<div class="card-rating"><span class="card-rating-stars">' + '⭐'.repeat(Math.round(product.rating)) + '</span><span>' + product.rating + ' (' + (product.reviews || 0) + ')</span></div>';
    }
    
    return '<div class="product-card" data-product-id="' + product.id + '">' +
        '<div class="card-image-wrapper">' +
            badgeHTML +
            imageHTML +
            '<div class="card-price-overlay">₹' + product.price + '</div>' +
        '</div>' +
        '<div class="card-info">' +
            '<div class="card-name-row">' +
                '<span class="card-name">' + product.name + '</span>' +
                '<span class="card-weight">' + (product.weight || '') + '</span>' +
            '</div>' +
            discountRow +
            ratingRow +
            '<div class="card-price-row">' +
                '<span class="card-price">₹' + product.price + '</span>' +
                (product.mrp ? '<span class="card-mrp">₹' + product.mrp + '</span>' : '') +
            '</div>' +
            '<div class="card-buttons">' +
                '<button class="card-add-btn" data-product-id="' + product.id + '">🛒 Add</button>' +
                '<button class="card-buy-btn" data-product-id="' + product.id + '">⚡ Buy</button>' +
            '</div>' +
        '</div>' +
    '</div>';
}