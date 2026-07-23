// ========== PRODUCT LOADING & RENDERING ==========

const ProductLoader = {
    categoriesCache: null,
    productsCache: {},
    
    // Load categories list
    async loadCategoriesList() {
        if (this.categoriesCache) return this.categoriesCache;
        
        try {
            const response = await fetch(CONFIG.urls.categoriesList);
            const data = await response.json();
            this.categoriesCache = data.categories;
            return this.categoriesCache;
        } catch (e) {
            console.error('Failed to load categories:', e);
            return [];
        }
    },
    
    // Load products for a category
    async loadCategoryProducts(categoryId) {
        if (this.productsCache[categoryId]) return this.productsCache[categoryId];
        
        try {
            const categories = await this.loadCategoriesList();
            const category = categories.find(c => c.id === categoryId);
            if (!category) return { products: [] };
            
            const response = await fetch(category.file);
            const data = await response.json();
            this.productsCache[categoryId] = data;
            return data;
        } catch (e) {
            console.error(`Failed to load products for ${categoryId}:`, e);
            return { products: [] };
        }
    },
    
    // Load most ordered products
    async loadMostOrdered(limit = CONFIG.features.mostOrderedLimit) {
        const categories = await this.loadCategoriesList();
        let allProducts = [];
        
        const priorityCats = categories.filter(c => c.priority);
        const otherCats = categories.filter(c => !c.priority);
        const sortedCats = [...priorityCats, ...otherCats];
        
        for (const cat of sortedCats) {
            if (allProducts.length >= limit) break;
            
            try {
                const data = await this.loadCategoryProducts(cat.id);
                const popular = data.products
                    .filter(p => p.mostOrdered && p.inStock)
                    .slice(0, limit - allProducts.length);
                    
                popular.forEach(p => p.category = cat.id);
                allProducts = [...allProducts, ...popular];
            } catch (e) {
                continue;
            }
        }
        
        return allProducts.slice(0, limit);
    },
    
    // Load all products (for shop page)
    async loadAllProducts() {
        const categories = await this.loadCategoriesList();
        let allProducts = [];
        
        for (const cat of categories) {
            try {
                const data = await this.loadCategoryProducts(cat.id);
                data.products.forEach(p => {
                    p.category = cat.id;
                    p.categoryName = cat.name;
                });
                allProducts = [...allProducts, ...data.products.filter(p => p.inStock)];
            } catch (e) {
                continue;
            }
        }
        
        return allProducts;
    },
    
    // Search products across all categories
    async searchProducts(query, maxResults = CONFIG.features.searchSuggestionsLimit) {
        if (!query || query.length < 2) return [];
        
        const categories = await this.loadCategoriesList();
        let results = [];
        
        const priorityCats = categories.filter(c => c.priority);
        const otherCats = categories.filter(c => !c.priority);
        const sortedCats = [...priorityCats, ...otherCats];
        
        for (const cat of sortedCats) {
            if (results.length >= maxResults * 2) break;
            
            try {
                const data = await this.loadCategoryProducts(cat.id);
                
                for (const product of data.products) {
                    if (!product.inStock) continue;
                    
                    const result = Utils.fuzzyMatch(query, product.name);
                    if (result.match) {
                        results.push({
                            ...product,
                            category: cat.id,
                            categoryName: cat.name,
                            searchScore: result.score
                        });
                    }
                }
            } catch (e) {
                continue;
            }
        }
        
        // Sort by score, then by most ordered
        results.sort((a, b) => {
            if (b.searchScore !== a.searchScore) return b.searchScore - a.searchScore;
            return (b.mostOrdered ? 1 : 0) - (a.mostOrdered ? 1 : 0);
        });
        
        return results.slice(0, maxResults);
    },
    
    // Get single product by ID
    async getProductById(productId) {
        const categories = await this.loadCategoriesList();
        
        for (const cat of categories) {
            try {
                const data = await this.loadCategoryProducts(cat.id);
                const product = data.products.find(p => p.id === productId);
                if (product) {
                    return { ...product, category: cat.id, categoryName: cat.name };
                }
            } catch (e) {
                continue;
            }
        }
        
        return null;
    },
    
    // Render product card HTML
    renderProductCard(product) {
        const discount = Utils.calculateDiscount(product.mrp, product.price);
        
        let badgeHTML = '';
        if (product.badge === 'best-seller') {
            badgeHTML = '<span class="card-badge badge-best-seller">⭐ Best</span>';
        } else if (product.badge === 'premium') {
            badgeHTML = '<span class="card-badge badge-premium">Premium</span>';
        } else if (product.badge === 'new') {
            badgeHTML = '<span class="card-badge badge-new">New</span>';
        } else if (discount > 0) {
            badgeHTML = `<span class="card-badge badge-discount">-${discount}%</span>`;
        }
        
        return `
            <div class="product-card" data-id="${product.id}" onclick="showProductDetail('${product.id}')">
                <div class="card-image-wrapper">
                    <img src="${product.image || CONFIG.urls.placeholderImage + '?random=' + product.id}" 
                         alt="${product.name}" 
                         loading="lazy"
                         onerror="this.src='${CONFIG.urls.placeholderImage}?random=' + Math.random()">
                    ${badgeHTML}
                    <div class="price-overlay">
                        <span>${Utils.formatPrice(product.price)}</span>
                    </div>
                </div>
                <div class="card-info">
                    <div class="card-name-row">
                        <span class="card-name">${product.name}</span>
                        <span class="card-weight">${product.weight}</span>
                    </div>
                    ${discount > 0 ? `<div class="card-discount">-${discount}% OFF</div>` : ''}
                    <div class="card-actions">
                        <button class="btn-cart" onclick="event.stopPropagation(); addToCartFromCard('${product.id}')">
                            🛒 Cart
                        </button>
                        <button class="btn-buy" onclick="event.stopPropagation(); buyNow('${product.id}')">
                            🛍️ Buy
                        </button>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Render compact card (for recently viewed)
    renderCompactCard(product) {
        const discount = Utils.calculateDiscount(product.mrp, product.price);
        
        return `
            <div class="recent-card" data-id="${product.id}" onclick="showProductDetail('${product.id}')">
                <div class="card-image-wrapper">
                    <img src="${product.image || CONFIG.urls.placeholderImage + '?random=' + product.id}" 
                         alt="${product.name}" 
                         loading="lazy"
                         onerror="this.src='${CONFIG.urls.placeholderImage}?random=' + Math.random()">
                    <div class="price-overlay">
                        <span>${Utils.formatPrice(product.price)}</span>
                    </div>
                </div>
                <div class="card-info">
                    <div class="card-name">${Utils.truncateText(product.name, 20)}</div>
                    <div class="card-weight">${product.weight}</div>
                    ${discount > 0 ? `<div class="card-discount">-${discount}%</div>` : ''}
                    <button class="btn-cart" onclick="event.stopPropagation(); addToCartFromCard('${product.id}')">
                        🛒 Add
                    </button>
                </div>
            </div>
        `;
    }
};