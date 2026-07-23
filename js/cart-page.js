

// ========== CART PAGE INIT ==========

document.addEventListener('DOMContentLoaded', () => {
    // Init theme
    Theme.init();
    
    // Setup UI
    UI.setupHeaderScroll();
    UI.setupBackToTop();
    UI.setupNavNavigation();
    UI.setActiveNav('cart');
    UI.updateCartBadge();
    UI.setupPopupClose('checkoutPopupOverlay', '.checkout-popup');
    UI.setupPopupClose('successPopupOverlay', '.success-popup');
    UI.setupPopupClose('ordersPopupOverlay', '.orders-popup');
    
    // Render cart
    renderCart();
    
    // Header brand click
    const headerBrand = document.getElementById('headerBrand');
    if (headerBrand) {
        headerBrand.addEventListener('click', function(e) {
            UI.createRipple(e, this);
            window.location.href = 'index.html';
        });
    }
    
    // Checkout popup close
    const checkoutPopupClose = document.getElementById('checkoutPopupClose');
    if (checkoutPopupClose) {
        checkoutPopupClose.addEventListener('click', () => UI.hidePopup('checkoutPopupOverlay'));
    }
    
    // Success popup
    const successPopupClose = document.getElementById('successPopupClose');
    if (successPopupClose) {
        successPopupClose.addEventListener('click', () => UI.hidePopup('successPopupOverlay'));
    }
    
    const viewOrdersBtn = document.getElementById('viewMyOrdersBtn');
    if (viewOrdersBtn) {
        viewOrdersBtn.addEventListener('click', () => {
            UI.hidePopup('successPopupOverlay');
            UI.showPopup('ordersPopupOverlay');
            if (typeof loadMyOrders === 'function') loadMyOrders();
        });
    }
    
    const backHomeBtn = document.getElementById('backToHomeBtn');
    if (backHomeBtn) {
        backHomeBtn.addEventListener('click', () => UI.hidePopup('successPopupOverlay'));
    }
    
    // Orders popup close
    const ordersPopupClose = document.getElementById('ordersPopupClose');
    if (ordersPopupClose) {
        ordersPopupClose.addEventListener('click', () => UI.hidePopup('ordersPopupOverlay'));
    }
    
    // Clear all
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', showClearConfirmation);
    }
    
    // Buy selected
    const buySelectedBtn = document.getElementById('buySelectedBtn');
    if (buySelectedBtn) {
        buySelectedBtn.addEventListener('click', () => {
            const selected = Cart.getSelected();
            if (selected.length === 0) {
                alert('Please select items to buy!');
                return;
            }
            openCheckout();
        });
    }
});

function renderCart() {
    const cart = Cart.get();
    const cartItems = document.getElementById('cartItems');
    const cartEmpty = document.getElementById('cartEmpty');
    const cartSummary = document.getElementById('cartSummary');
    const cartCount = document.getElementById('cartCount');
    const clearAllBtn = document.getElementById('clearAllBtn');
    
    if (!cartItems) return;
    
    if (cart.items.length === 0) {
        cartItems.innerHTML = '';
        if (cartEmpty) cartEmpty.classList.add('show');
        if (cartSummary) cartSummary.style.display = 'none';
        if (clearAllBtn) clearAllBtn.style.display = 'none';
        if (cartCount) cartCount.textContent = '(0 items)';
        return;
    }
    
    if (cartEmpty) cartEmpty.classList.remove('show');
    if (cartSummary) cartSummary.style.display = 'block';
    if (clearAllBtn) clearAllBtn.style.display = 'flex';
    if (cartCount) cartCount.textContent = `(${cart.totalItems} items)`;
    
    cartItems.innerHTML = cart.items.map(item => `
        <div class="cart-item" id="cartItem${item.id}">
            <input type="checkbox" 
                   class="cart-item-checkbox" 
                   ${item.selected ? 'checked' : ''} 
                   onchange="toggleCartItem('${item.id}')">
            <img src="${item.image || CONFIG.urls.placeholderImage + '?random=' + item.id}" 
                 alt="${item.name}" 
                 class="cart-item-image"
                 onerror="this.src='${CONFIG.urls.placeholderImage}?random=' + Math.random()">
            <div class="cart-item-details">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-weight">${item.weight}</div>
                <div class="cart-item-price-row">${Utils.formatPrice(item.price)} × ${item.quantity} = ${Utils.formatPrice(item.price * item.quantity)}</div>
            </div>
            <div class="cart-item-controls">
                <button class="qty-btn" onclick="updateCartQty('${item.id}', -1)">−</button>
                <span class="qty-value">${item.quantity}</span>
                <button class="qty-btn" onclick="updateCartQty('${item.id}', 1)">+</button>
            </div>
            <button class="cart-item-remove" onclick="removeCartItem('${item.id}')" title="Remove">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join('');
    
    updateCartSummary();
}

function toggleCartItem(productId) {
    Cart.toggleSelect(productId);
    updateCartSummary();
}

function updateCartQty(productId, change) {
    const cart = Cart.get();
    const item = cart.items.find(i => i.id === productId);
    if (!item) return;
    
    const newQty = item.quantity + change;
    if (newQty <= 0) {
        removeCartItem(productId);
        return;
    }
    
    Cart.updateQuantity(productId, newQty);
    renderCart();
}

function removeCartItem(productId) {
    const cartItem = document.getElementById('cartItem' + productId);
    if (cartItem) {
        cartItem.classList.add('removing');
        setTimeout(() => {
            Cart.remove(productId);
            renderCart();
        }, 300);
    } else {
        Cart.remove(productId);
        renderCart();
    }
}

function updateCartSummary() {
    const selectedCount = document.getElementById('selectedCount');
    const subtotalAmount = document.getElementById('subtotalAmount');
    const totalAmount = document.getElementById('totalAmount');
    const buySelectedBtn = document.getElementById('buySelectedBtn');
    
    const count = Cart.getSelectedCount();
    const total = Cart.getSelectedTotal();
    
    if (selectedCount) selectedCount.textContent = count + ' items';
    if (subtotalAmount) subtotalAmount.textContent = Utils.formatPrice(total);
    if (totalAmount) totalAmount.textContent = Utils.formatPrice(total);
    if (buySelectedBtn) buySelectedBtn.textContent = `🛍️ Buy Selected (${count})`;
}

function showClearConfirmation() {
    const overlay = document.createElement('div');
    overlay.className = 'clear-confirm-overlay';
    overlay.innerHTML = `
        <div class="clear-confirm">
            <h4>⚠️ Clear Cart?</h4>
            <p>Are you sure you want to remove all items?</p>
            <div class="clear-confirm-actions">
                <button class="btn btn-outline" onclick="this.closest('.clear-confirm-overlay').remove()">Cancel</button>
                <button class="btn btn-primary" style="background:var(--danger);" onclick="clearAllCart(this)">Clear All</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) overlay.remove();
    });
}

function clearAllCart(btn) {
    Cart.clear();
    btn.closest('.clear-confirm-overlay').remove();
    renderCart();
}