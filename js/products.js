const Products = {
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
            const response = await fetch(CONFIG.urls.categoriesList);
            const data = await response.json();
            const categories = data.categories;
            this.allProducts = [];
            
            for (const cat of categories) {
                try {
                    const catResponse = await fetch(cat.file);
                    const catData = await catResponse.json();
                    const products = catData.products.filter(p => p.inStock);
                    this.allProducts = [...this.allProducts, ...products];
                } catch (e) { /* skip */ }
            }
        } catch (error) {
            console.error('Failed to load all products:', error);
            this.allProducts = this.getFallbackProducts();
        }
    },
    
    async loadMostOrdered() {
        if (this.allProducts.length === 0) await this.loadAllProducts();
        this.mostOrderedProducts = this.allProducts.filter(p => p.mostOrdered).slice(0, 12);
        if (this.mostOrderedProducts.length === 0) this.mostOrderedProducts = this.allProducts.slice(0, 8);
        this.renderProductCards(this.mostOrderedProducts, 'productsGrid');
        document.getElementById('mostOrderedSection').style.display = 'block';
    },
    
    async loadCategoryProducts(categoryId) {
        UI.showLoading();
        try {
            const cat = Categories.categoriesList.find(c => c.id === categoryId);
            if (!cat) throw new Error('Category not found');
            const response = await fetch(cat.file);
            const data = await response.json();
            const products = data.products.filter(p => p.inStock);
            UI.hideLoading();
            return products;
        } catch (error) {
            console.error('Failed to load category products:', error);
            UI.hideLoading();
            return this.allProducts.filter(p => p.category === categoryId) || this.getFallbackProducts();
        }
    },
    
    // Search function for real products
    searchProducts(query) {
        if (this.allProducts.length === 0) return [];
        const q = query.toLowerCase();
        return this.allProducts.filter(p => 
            p.name.toLowerCase().includes(q) || 
            (p.weight && p.weight.toLowerCase().includes(q))
        );
    },
    
    renderProductCards(products, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (!products || products.length === 0) {
            container.innerHTML = `<div class="empty-products-message" style="grid-column:1/-1;"><span style="font-size:48px;">📦</span><p>Products coming soon!</p><p style="font-size:12px;color:#999;">We're adding products to this category</p></div>`;
            return;
        }
        
        container.innerHTML = products.map(product => this.createProductCardHTML(product)).join('');
        
        container.querySelectorAll('.card-add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const productId = btn.dataset.productId;
                const product = products.find(p => p.id === productId);
                if (product) {
                    Cart.addItem(product, 1);
                    UI.showCartToast(product.name);
                    UI.addToRecentlyViewed(product);
                }
            });
        });
        // After existing Add to Cart listener, add:
container.querySelectorAll('.card-buy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const productId = btn.dataset.productId;
        const product = products.find(p => p.id === productId);
        if (product) CheckoutModal.open(product);
    });
});
        // After existing Add to Cart listener block, add this:
container.querySelectorAll('.card-buy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const productId = btn.dataset.productId;
        const product = products.find(p => p.id === productId);
        if (product) {
            CheckoutModal.open(product);
        }
    });
});
        
        // Inside renderProductCards, after adding Add to Cart listener:
container.querySelectorAll('.card-buy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const productId = btn.dataset.productId;
        const product = products.find(p => p.id === productId);
        if (product) {
            CheckoutModal.open(product); // single product buy now
        }
    });
});
    createProductCardHTML(product) {
    const badgeHTML = product.badge ? 
        `<span class="card-badge ${product.badge}">${
            product.badge === 'best-seller' ? '🏆 Best' :
            product.badge === 'popular' ? '🔥 Popular' :
            product.badge === 'new' ? '✨ New' :
            product.badge === 'discount' ? `${Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF` : ''
        }</span>` : '';
    
    const imageHTML = product.image && product.image.startsWith('http') ?
        `<img src="${product.image}" alt="${product.name}" class="card-image" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'card-image-placeholder\\'>${product.icon || '📦'}</div>'">` :
        `<div class="card-image-placeholder">${product.icon || '📦'}</div>`;
    
    const discount = product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
    
    return `
        <div class="product-card" data-product-id="${product.id}">
            <div class="card-image-wrapper">
                ${badgeHTML}
                ${imageHTML}
                <div class="card-price-overlay">₹${product.price}</div>
            </div>
            <div class="card-info">
                <div class="card-name">${product.name}</div>
                <div class="card-weight">${product.weight || ''}</div>
                ${product.rating ? `<div class="card-rating"><span class="card-rating-stars">${'⭐'.repeat(Math.round(product.rating))}</span><span>${product.rating} (${product.reviews || 0})</span></div>` : ''}
                <div class="card-bottom">
                    <div>
                        <span class="card-price">₹${product.price}</span>
                        ${product.mrp ? `<span class="card-mrp">₹${product.mrp}</span>` : ''}
                        ${discount > 0 ? `<span style="font-size:10px;color:#E85D75;font-weight:600;">${discount}% OFF</span>` : ''}
                    </div>
                    <div style="display:flex;gap:4px;">
                        <button class="card-add-btn" data-product-id="${product.id}">🛒 Add</button>
                        <button class="card-buy-btn" data-product-id="${product.id}">⚡ Buy</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}
    
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
console.log('✅ Quick Dukan — Products Loader Ready');