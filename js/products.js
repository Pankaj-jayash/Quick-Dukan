// ============================================
// PRODUCTS.JS - Product Card Creation & All Products Section
// ============================================

class ProductsManager {
    constructor() {
        this.allProductsGrid = document.getElementById('allProductsGrid');
        
        this.init();
    }
    
    init() {
        document.addEventListener('dataLoaded', (e) => {
            this.renderAllProducts(e.detail.allProducts);
        });
        
        document.addEventListener('languageChanged', () => {
            this.refreshAllProducts();
        });
    }
    
    renderAllProducts(products) {
        if (!this.allProductsGrid) return;
        this.allProductsGrid.innerHTML = '';
        
        products.forEach(product => {
            const card = this.createProductCard(product);
            this.allProductsGrid.appendChild(card);
        });
    }
    
    refreshAllProducts() {
        if (window.dataLoader && window.dataLoader.isLoaded) {
            this.renderAllProducts(window.dataLoader.allProducts);
        }
    }
    
    createProductCard(product) {
        const lang = window.languageManager?.currentLang || 'hi';
        const name = product.name ? (product.name[lang] || product.name.hi || product.name.en || '') : '';
        const unit = product.unit ? (product.unit[lang] || product.unit.hi || product.unit.en || '') : '';
        const price = product.price || 0;
        const discount = product.discount || 0;
        const image = product.image || 'https://via.placeholder.com/300?text=No+Image';
        
        const card = document.createElement('div');
        card.className = 'product-card fade-in';
        card.setAttribute('data-product-id', product.id);
        card.setAttribute('data-product-name', JSON.stringify(product.name || {}));
        card.setAttribute('data-product-unit', JSON.stringify(product.unit || {}));
        
        card.innerHTML = `
            <div class="product-card-image">
                <img src="${image}" 
                     alt="${name}" 
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/300?text=No+Image'">
                <div class="price-overlay">₹${price}</div>
            </div>
            <div class="product-card-info">
                <div class="product-name-row">
                    <span class="product-unit">${unit}</span>
                    <span class="product-name">${name}</span>
                </div>
                <div class="product-discount">
                    ${discount > 0 ? `🔥 ${discount}% OFF` : ''}
                </div>
                <div class="product-buttons">
                    <button class="btn-add-cart" data-action="add-to-cart">
                        <i class="fas fa-plus"></i> ${lang === 'hi' ? 'कार्ट' : 'Cart'}
                    </button>
                    <button class="btn-buy-now" data-action="buy-now">
                        <i class="fab fa-whatsapp"></i> ${lang === 'hi' ? 'खरीदें' : 'Buy'}
                    </button>
                </div>
            </div>
        `;
        
        // Add to Cart button
        const addToCartBtn = card.querySelector('[data-action="add-to-cart"]');
        addToCartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.addToCart(product, addToCartBtn);
        });
        
        // ⭐ BUY NOW BUTTON - OPENS CHECKOUT ⭐
        const buyNowBtn = card.querySelector('[data-action="buy-now"]');
        buyNowBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.buyNow(product, buyNowBtn);
        });
        
        // Click on card to view product
        card.addEventListener('click', () => {
            this.addToRecentlyViewed(product);
        });
        
        return card;
    }
    
    addToCart(product, button) {
        if (window.cartManager) {
            window.cartManager.addItem(product);
        }
        
        if (button) {
            button.classList.add('pop-animation');
            setTimeout(() => button.classList.remove('pop-animation'), 300);
        }
        
        this.showToast(CONFIG.sectionTitles[window.languageManager?.currentLang || 'hi'].addedToCart || '✅ Added!');
    }
    
    // ⭐ BUY NOW - OPENS CHECKOUT WITH SINGLE PRODUCT ⭐
    buyNow(product, button) {
        if (button) {
            button.classList.add('pop-animation');
            setTimeout(() => button.classList.remove('pop-animation'), 300);
        }
        
        // Create cart item format
        const cartItems = [{
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            unit: product.unit,
            discount: product.discount || 0,
            quantity: 1,
        }];
        
        const total = product.price || 0;
        
        // Open checkout with single product
        if (window.checkoutManager && typeof window.checkoutManager.open === 'function') {
            window.checkoutManager.open(cartItems, total, 1);
        } else {
            // Fallback: direct WhatsApp
            console.warn('⚠️ Checkout not available, sending direct WhatsApp');
            this.buyNowDirect(product);
        }
    }
    
    // Fallback direct WhatsApp for Buy Now
    buyNowDirect(product) {
        const lang = window.languageManager?.currentLang || 'hi';
        const name = product.name ? (product.name[lang] || product.name.hi || '') : '';
        const unit = product.unit ? (product.unit[lang] || product.unit.hi || '') : '';
        const price = product.price || 0;
        
        const message = `नमस्ते Quick Dukan! 🙏\n\nमुझे ऑर्डर करना है:\n📦 ${name} - ${unit}\n💰 कीमत: ₹${price}\n\nकृपया डिलीवरी की जानकारी दें।`;
        
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
    }
    
    addToRecentlyViewed(product) {
        if (window.recentlyViewedManager) {
            window.recentlyViewedManager.addProduct(product);
        }
    }
    
    showToast(message) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.classList.remove('hidden');
        toast.classList.add('slide-up');
        
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                toast.classList.add('hidden');
                toast.classList.remove('fade-out', 'slide-up');
            }, 300);
        }, 2000);
    }
    
    // Create a product card for horizontal scroll sections
    createHorizontalCard(product) {
        return this.createProductCard(product);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.productsManager = new ProductsManager();
});