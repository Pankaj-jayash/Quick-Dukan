// ============================================
// CART.JS - Premium Cart Logic
// ============================================

class CartManager {
    constructor() {
        this.cart = [];
        this.cartModal = document.getElementById('cartModal');
        this.cartItems = document.getElementById('cartItems');
        this.emptyCart = document.getElementById('emptyCart');
        this.cartSummary = document.getElementById('cartSummary');
        this.cartBadge = document.getElementById('cartBadge');
        this.closeCartBtn = document.getElementById('closeCart');
        this.sendOrderBtn = document.getElementById('sendOrderBtn');
        this.clearCartBtn = document.getElementById('clearCartBtn');
        this.cartOverlay = null;
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.totalItems = document.getElementById('totalItems');
        this.subtotal = document.getElementById('subtotal');
        this.totalPrice = document.getElementById('totalPrice');
        this.storageKey = 'quick-dukan-cart';
        this.freeDeliveryThreshold = 500;
        this._toastTimer = null;
        
        if (!this.cartModal) {
            console.error('❌ Cart Modal not found in DOM!');
            return;
        }
        
        this.cartOverlay = this.cartModal.querySelector('.cart-overlay');
        
        this.init();
        console.log('✅ Cart Manager Initialized');
    }
    
    init() {
        this.loadCart();
        
        // Close button
        if (this.closeCartBtn) {
            const newBtn = this.closeCartBtn.cloneNode(true);
            this.closeCartBtn.parentNode.replaceChild(newBtn, this.closeCartBtn);
            this.closeCartBtn = newBtn;
            this.closeCartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeCart();
            });
        }
        
        // Overlay click
        if (this.cartOverlay) {
            const newOverlay = this.cartOverlay.cloneNode(true);
            this.cartOverlay.parentNode.replaceChild(newOverlay, this.cartOverlay);
            this.cartOverlay = newOverlay;
            this.cartOverlay.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeCart();
            });
        }
        
        // Send order button - NOW OPENS CHECKOUT
        if (this.sendOrderBtn) {
            const newSendBtn = this.sendOrderBtn.cloneNode(true);
            this.sendOrderBtn.parentNode.replaceChild(newSendBtn, this.sendOrderBtn);
            this.sendOrderBtn = newSendBtn;
            this.sendOrderBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.sendOrder(); // This now opens checkout
            });
        }
        
        // Clear cart button
        if (this.clearCartBtn) {
            const newClearBtn = this.clearCartBtn.cloneNode(true);
            this.clearCartBtn.parentNode.replaceChild(newClearBtn, this.clearCartBtn);
            this.clearCartBtn = newClearBtn;
            this.clearCartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.clearCart();
            });
        }
        
        // Browse products button (empty state)
        document.addEventListener('click', (e) => {
            const browseBtn = e.target.closest('.browse-products-btn');
            if (browseBtn) {
                e.preventDefault();
                this.closeCart();
                const allProducts = document.getElementById('allProductsSection');
                if (allProducts) allProducts.scrollIntoView({ behavior: 'smooth' });
            }
        });
        
        // Bottom nav cart button
        document.addEventListener('click', (e) => {
            const cartBtn = e.target.closest('[data-nav="cart"]');
            if (cartBtn) {
                e.preventDefault();
                e.stopPropagation();
                this.openCart();
                return;
            }
        });
        
        // Keyboard escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.cartModal.classList.contains('hidden')) {
                this.closeCart();
            }
        });
        
        // Swipe down to close (mobile)
        let touchStartY = 0;
        const cartContent = this.cartModal.querySelector('.cart-content');
        if (cartContent) {
            cartContent.addEventListener('touchstart', (e) => {
                touchStartY = e.touches[0].clientY;
            }, { passive: true });
            
            cartContent.addEventListener('touchmove', (e) => {
                const touchY = e.touches[0].clientY;
                const diff = touchY - touchStartY;
                if (cartContent.scrollTop <= 0 && diff > 80) {
                    this.closeCart();
                }
            }, { passive: true });
        }
    }
    
    loadCart() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            this.cart = saved ? JSON.parse(saved) : [];
        } catch (e) {
            this.cart = [];
        }
        this.updateBadge();
    }
    
    saveCart() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.cart));
        } catch (e) {
            console.warn('Could not save cart');
        }
    }
    
    addItem(product) {
        const existing = this.cart.find(item => item.id === product.id);
        
        if (existing) {
            existing.quantity = (existing.quantity || 1) + 1;
            this.showQuickToast('✅ मात्रा बढ़ाई!');
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                unit: product.unit,
                discount: product.discount || 0,
                quantity: 1,
            });
            this.showQuickToast('🎉 कार्ट में जोड़ा!');
        }
        
        this.saveCart();
        this.updateBadge();
        this.animateCartIcon();
        
        if (!this.cartModal.classList.contains('hidden')) {
            this.renderCart();
        }
    }
    
    removeItem(productId) {
        const cartItemEl = document.querySelector(`[data-cart-item="${productId}"]`);
        if (cartItemEl) {
            cartItemEl.classList.add('removing');
            setTimeout(() => {
                this.cart = this.cart.filter(item => item.id !== productId);
                this.saveCart();
                this.updateBadge();
                this.renderCart();
                this.showQuickToast('🗑️ हटा दिया');
            }, 300);
        } else {
            this.cart = this.cart.filter(item => item.id !== productId);
            this.saveCart();
            this.updateBadge();
            this.renderCart();
        }
    }
    
    updateQuantity(productId, quantity) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity = Math.max(1, quantity);
            this.saveCart();
            this.updateBadge();
            this.renderCart();
        }
    }
    
    clearCart() {
        if (this.cart.length === 0) return;
        
        const items = document.querySelectorAll('.cart-item');
        if (items.length > 0) {
            items.forEach((item, i) => {
                setTimeout(() => item.classList.add('removing'), i * 50);
            });
            setTimeout(() => {
                this.cart = [];
                this.saveCart();
                this.updateBadge();
                this.renderCart();
                this.showQuickToast('🗑️ कार्ट खाली कर दिया');
            }, items.length * 50 + 300);
        } else {
            this.cart = [];
            this.saveCart();
            this.updateBadge();
            this.renderCart();
        }
    }
    
    getTotalItems() {
        return this.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    }
    
    getTotalPrice() {
        return this.cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    }
    
    getOriginalPrice(item) {
        if (!item.discount) return item.price;
        return Math.round(item.price / (1 - item.discount / 100));
    }
    
    updateBadge() {
        if (!this.cartBadge) return;
        const total = this.getTotalItems();
        if (total > 0) {
            this.cartBadge.textContent = total > 99 ? '99+' : total;
            this.cartBadge.classList.remove('hidden');
            this.cartBadge.style.animation = 'none';
            this.cartBadge.offsetHeight;
            this.cartBadge.style.animation = 'pop 0.3s ease';
        } else {
            this.cartBadge.classList.add('hidden');
        }
    }
    
    animateCartIcon() {
        const cartBtn = document.querySelector('[data-nav="cart"]');
        if (cartBtn) {
            cartBtn.classList.add('pop-animation');
            setTimeout(() => cartBtn.classList.remove('pop-animation'), 300);
        }
    }
    
    openCart() {
        if (!this.cartModal) return;
        this.renderCart();
        this.cartModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
    }
    
    closeCart() {
        if (!this.cartModal) return;
        this.cartModal.classList.add('hidden');
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
    }
    
    // ============================================
    // ⭐ SEND ORDER - NOW OPENS CHECKOUT ⭐
    // ============================================
    sendOrder() {
        if (this.cart.length === 0) return;
        
        const total = this.getTotalPrice();
        const itemCount = this.getTotalItems();
        
        // Close cart first
        this.closeCart();
        
        // Open checkout with cart items
        setTimeout(() => {
            if (window.checkoutManager && typeof window.checkoutManager.open === 'function') {
                window.checkoutManager.open(this.cart, total, itemCount);
            } else {
                // Fallback: direct WhatsApp if checkout not available
                console.warn('⚠️ Checkout not available, sending direct WhatsApp');
                this.sendDirectWhatsApp();
            }
        }, 300);
    }
    
    // Fallback direct WhatsApp (if checkout fails)
    sendDirectWhatsApp() {
        if (this.cart.length === 0) return;
        
        const lang = window.languageManager?.currentLang || 'hi';
        let message = '🛒 *Quick Dukan - नया ऑर्डर*\n\n';
        message += '━━━━━━━━━━━━━━━━\n\n';
        
        this.cart.forEach((item, index) => {
            const name = item.name ? (item.name[lang] || item.name.hi || item.name.en || '') : '';
            const unit = item.unit ? (item.unit[lang] || item.unit.hi || item.unit.en || '') : '';
            const price = item.price || 0;
            const quantity = item.quantity || 1;
            
            message += `${index + 1}. ${name}\n`;
            message += `   ${unit} × ${quantity} = ₹${price * quantity}\n`;
        });
        
        message += '\n━━━━━━━━━━━━━━━━\n';
        message += `📦 कुल आइटम: ${this.getTotalItems()}\n`;
        message += `💰 कुल राशि: ₹${this.getTotalPrice()}\n`;
        message += '\n🙏 कृपया ऑर्डर कन्फर्म करें और डिलीवरी की जानकारी दें।';
        
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
        
        // Save order
        if (window.ordersManager) {
            window.ordersManager.saveOrder({
                items: this.cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    image: item.image,
                    unit: item.unit,
                    discount: item.discount || 0,
                    quantity: item.quantity || 1,
                })),
                total: this.getTotalPrice(),
                itemCount: this.getTotalItems(),
            });
        }
        
        // Clear cart
        setTimeout(() => {
            this.cart = [];
            this.saveCart();
            this.updateBadge();
        }, 500);
        
        this.showQuickToast('✅ ऑर्डर WhatsApp पर भेज दिया!');
    }
    
    renderCart() {
        if (!this.cartItems) return;
        this.cartItems.innerHTML = '';
        
        if (this.cart.length === 0) {
            if (this.emptyCart) this.emptyCart.classList.remove('hidden');
            if (this.cartSummary) this.cartSummary.classList.add('hidden');
            if (this.clearCartBtn) this.clearCartBtn.style.display = 'none';
            if (this.sendOrderBtn) {
                this.sendOrderBtn.style.opacity = '0.5';
                this.sendOrderBtn.style.pointerEvents = 'none';
            }
            this.updateProgressBar(0);
            return;
        }
        
        if (this.emptyCart) this.emptyCart.classList.add('hidden');
        if (this.cartSummary) this.cartSummary.classList.remove('hidden');
        if (this.clearCartBtn) this.clearCartBtn.style.display = 'flex';
        if (this.sendOrderBtn) {
            this.sendOrderBtn.style.opacity = '1';
            this.sendOrderBtn.style.pointerEvents = 'auto';
        }
        
        const lang = window.languageManager?.currentLang || 'hi';
        
        this.cart.forEach(item => {
            const name = item.name ? (item.name[lang] || item.name.hi || item.name.en || '') : '';
            const unit = item.unit ? (item.unit[lang] || item.unit.hi || item.unit.en || '') : '';
            const price = item.price || 0;
            const quantity = item.quantity || 1;
            const image = item.image || 'https://via.placeholder.com/60';
            const originalPrice = this.getOriginalPrice(item);
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.setAttribute('data-cart-item', item.id);
            cartItem.innerHTML = `
                <img src="${image}" alt="${name}" class="cart-item-image" 
                     onerror="this.src='https://via.placeholder.com/60?text=🛒'">
                <div class="cart-item-info">
                    <div class="cart-item-name">${name}</div>
                    <div class="cart-item-unit">${unit}</div>
                    <div class="cart-item-price-row">
                        <span class="cart-item-price">₹${price * quantity}</span>
                        ${item.discount > 0 ? `<span class="cart-item-old-price">₹${originalPrice * quantity}</span>` : ''}
                    </div>
                </div>
                <div class="cart-item-actions">
                    <div class="qty-control">
                        <button class="qty-btn qty-minus" data-id="${item.id}">−</button>
                        <span class="qty-display">${quantity}</span>
                        <button class="qty-btn qty-plus" data-id="${item.id}">+</button>
                    </div>
                    <button class="remove-btn" data-id="${item.id}">
                        <span>🗑️</span>
                    </button>
                </div>
            `;
            
            cartItem.querySelector('.qty-plus').addEventListener('click', (e) => {
                e.stopPropagation();
                this.updateQuantity(item.id, quantity + 1);
            });
            
            cartItem.querySelector('.qty-minus').addEventListener('click', (e) => {
                e.stopPropagation();
                if (quantity <= 1) {
                    this.removeItem(item.id);
                } else {
                    this.updateQuantity(item.id, quantity - 1);
                }
            });
            
            cartItem.querySelector('.remove-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeItem(item.id);
            });
            
            this.cartItems.appendChild(cartItem);
        });
        
        const total = this.getTotalPrice();
        const itemsCount = this.getTotalItems();
        
        if (this.totalItems) this.totalItems.textContent = itemsCount;
        if (this.subtotal) this.subtotal.textContent = `₹${total}`;
        if (this.totalPrice) this.totalPrice.textContent = `₹${total}`;
        
        this.updateProgressBar(total);
    }
    
    updateProgressBar(total) {
        if (!this.progressFill || !this.progressText) return;
        
        const percentage = Math.min((total / this.freeDeliveryThreshold) * 100, 100);
        this.progressFill.style.width = `${percentage}%`;
        
        const lang = window.languageManager?.currentLang || 'hi';
        
        if (total >= this.freeDeliveryThreshold) {
            this.progressFill.classList.add('complete');
            this.progressText.classList.add('complete');
            this.progressText.textContent = lang === 'hi' 
                ? '🎉 बधाई! आपकी डिलीवरी फ्री है!' 
                : '🎉 Congrats! Free Delivery!';
        } else {
            this.progressFill.classList.remove('complete');
            this.progressText.classList.remove('complete');
            const remaining = this.freeDeliveryThreshold - total;
            this.progressText.textContent = lang === 'hi'
                ? `🚚 फ्री डिलीवरी के लिए सिर्फ ₹${remaining} और जोड़ें!`
                : `🚚 Add ₹${remaining} more for FREE delivery!`;
        }
    }
    
    showQuickToast(message) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.classList.remove('hidden');
        toast.style.animation = 'none';
        toast.offsetHeight;
        toast.style.animation = 'slideUp 0.3s ease';
        
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 1800);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.cartManager = new CartManager();
    }, 100);
});