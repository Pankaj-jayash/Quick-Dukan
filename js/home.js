// ========== HOME PAGE INIT ==========

document.addEventListener('DOMContentLoaded', async () => {
    // Init theme
    Theme.init();
    
    // Setup UI
    UI.setupHeaderScroll();
    UI.setupSearchSticky();
    UI.setupBackToTop();
    UI.setupNavNavigation();
    UI.setActiveNav('home');
    UI.updateCartBadge();
    UI.setupPopupClose('productPopupOverlay', '.product-popup');
    UI.setupPopupClose('checkoutPopupOverlay', '.checkout-popup');
    UI.setupPopupClose('successPopupOverlay', '.success-popup');
    UI.setupPopupClose('ordersPopupOverlay', '.orders-popup');
    
    // Init search
    Search.init();
    
    // Render categories
    await Categories.render();
    
    // Render recently viewed
    await Recent.render();
    
    // Render most ordered
    const mostOrderedGrid = document.getElementById('mostOrderedGrid');
    if (mostOrderedGrid) {
        const mostOrdered = await ProductLoader.loadMostOrdered(12);
        mostOrderedGrid.innerHTML = mostOrdered.map(p => ProductLoader.renderProductCard(p)).join('');
    }
    
    // Back to all button
    const backBtn = document.getElementById('backToAllBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            Categories.deselect();
            Recent.render();
        });
    }
    
    // Header brand click → home
    const headerBrand = document.getElementById('headerBrand');
    if (headerBrand) {
        headerBrand.addEventListener('click', function(e) {
            UI.createRipple(e, this);
            window.location.href = 'index.html';
        });
    }
    
    // Free delivery badge click → wobble
    const freeDeliveryBadge = document.getElementById('freeDeliveryBadge');
    if (freeDeliveryBadge) {
        freeDeliveryBadge.addEventListener('click', function(e) {
            UI.createRipple(e, this, 'rgba(255,255,255,0.2)');
        });
    }
    
    // Product popup close
    const productPopupClose = document.getElementById('productPopupClose');
    if (productPopupClose) {
        productPopupClose.addEventListener('click', () => {
            UI.hidePopup('productPopupOverlay');
        });
    }
    
    // Checkout popup close
    const checkoutPopupClose = document.getElementById('checkoutPopupClose');
    if (checkoutPopupClose) {
        checkoutPopupClose.addEventListener('click', () => {
            UI.hidePopup('checkoutPopupOverlay');
        });
    }
    
    // Success popup close
    const successPopupClose = document.getElementById('successPopupClose');
    if (successPopupClose) {
        successPopupClose.addEventListener('click', () => {
            UI.hidePopup('successPopupOverlay');
        });
    }
    
    // View my orders from success
    const viewOrdersBtn = document.getElementById('viewMyOrdersBtn');
    if (viewOrdersBtn) {
        viewOrdersBtn.addEventListener('click', () => {
            UI.hidePopup('successPopupOverlay');
            UI.showPopup('ordersPopupOverlay');
            if (typeof loadMyOrders === 'function') loadMyOrders();
        });
    }
    
    // Back to home from success
    const backHomeBtn = document.getElementById('backToHomeBtn');
    if (backHomeBtn) {
        backHomeBtn.addEventListener('click', () => {
            UI.hidePopup('successPopupOverlay');
        });
    }
    
    // Orders popup close
    const ordersPopupClose = document.getElementById('ordersPopupClose');
    if (ordersPopupClose) {
        ordersPopupClose.addEventListener('click', () => {
            UI.hidePopup('ordersPopupOverlay');
        });
    }
});

// ========== GLOBAL FUNCTIONS ==========

async function showProductDetail(productId) {
    const product = await ProductLoader.getProductById(productId);
    if (!product) return;
    
    // Add to recently viewed
    await Recent.add(product);
    
    const popupContent = document.getElementById('productPopupContent');
    if (!popupContent) return;
    
    const discount = Utils.calculateDiscount(product.mrp, product.price);
    const saveAmount = Utils.calculateSaveAmount(product.mrp, product.price);
    
    popupContent.innerHTML = `
        <div class="popup-image">
            <img src="${product.image || CONFIG.urls.placeholderImage + '?random=' + product.id}" 
                 alt="${product.name}"
                 onerror="this.src='${CONFIG.urls.placeholderImage}?random=' + Math.random()">
            ${discount > 0 ? `<span class="card-badge badge-discount" style="position:absolute;top:10px;left:10px;">-${discount}% OFF</span>` : ''}
        </div>
        <div class="popup-details">
            ${product.badge ? `<span class="popup-badge">${product.badge === 'best-seller' ? '⭐ Best Seller' : product.badge}</span>` : ''}
            <h3>${product.name}</h3>
            <span class="popup-weight">${product.weight}</span>
            <span class="popup-rating">⭐ ${product.rating || '4.0'} (${product.reviews || 0} reviews)</span>
            
            <div class="popup-price-box">
                <span class="current-price">${Utils.formatPrice(product.price)}</span>
                ${product.mrp > product.price ? `<span class="mrp">${Utils.formatPrice(product.mrp)}</span>` : ''}
                ${saveAmount > 0 ? `<div class="save">Save ${Utils.formatPrice(saveAmount)}</div>` : ''}
            </div>
            
            <div class="quantity-selector">
                <button onclick="updatePopupQty(-1)">−</button>
                <span class="qty-display" id="popupQty">1</span>
                <button onclick="updatePopupQty(1)">+</button>
            </div>
            
            <div class="popup-actions">
                <button class="btn btn-primary" onclick="addToCartFromPopup('${product.id}')">
                    🛒 Add to Cart
                </button>
                <button class="btn btn-buy" style="background:var(--secondary-light);color:white;width:100%;" 
                        onclick="buyNowFromPopup('${product.id}')">
                    🛍️ Buy Now
                </button>
            </div>
            
            <div class="popup-delivery-info">
                <span>🚚 ${CONFIG.delivery.estimatedTime}</span>
                <span>💵 Cash on Delivery</span>
            </div>
        </div>
    `;
    
    // Store current product ID for popup actions
    window._popupProduct = product;
    window._popupQty = 1;
    
    UI.showPopup('productPopupOverlay');
}

function updatePopupQty(change) {
    window._popupQty = Math.max(1, (window._popupQty || 1) + change);
    const qtyDisplay = document.getElementById('popupQty');
    if (qtyDisplay) qtyDisplay.textContent = window._popupQty;
}

function addToCartFromPopup(productId) {
    if (!window._popupProduct) return;
    const qty = window._popupQty || 1;
    Cart.add(window._popupProduct, qty);
    
    // Button feedback
    const btn = document.querySelector('.popup-actions .btn-primary');
    if (btn) {
        btn.textContent = '✓ Added!';
        btn.classList.add('added');
        setTimeout(() => {
            btn.textContent = '🛒 Add to Cart';
            btn.classList.remove('added');
        }, 1000);
    }
}

function buyNowFromPopup(productId) {
    if (!window._popupProduct) return;
    const qty = window._popupQty || 1;
    Cart.add(window._popupProduct, qty);
    
    // Open checkout
    openCheckout();
}

async function addToCartFromCard(productId) {
    const product = await ProductLoader.getProductById(productId);
    if (product) {
        Cart.add(product, 1);
        
        // Button feedback on the card
        const card = document.querySelector(`.product-card[data-id="${productId}"]`);
        if (card) {
            const cartBtn = card.querySelector('.btn-cart');
            if (cartBtn) {
                cartBtn.textContent = '✓ Added';
                cartBtn.classList.add('added');
                setTimeout(() => {
                    cartBtn.textContent = '🛒 Cart';
                    cartBtn.classList.remove('added');
                }, 1000);
            }
        }
    }
}

async function buyNow(productId) {
    const product = await ProductLoader.getProductById(productId);
    if (product) {
        Cart.add(product, 1);
        openCheckout();
    }
}

// ========== CHECKOUT FUNCTIONS ==========

async function openCheckout() {
    const cart = Cart.getSelected();
    if (cart.length === 0) {
        alert('Please select items to buy!');
        return;
    }
    
    const total = Cart.getSelectedTotal();
    const userDetails = Storage.getUserDetails();
    const location = await Utils.getUserLocation();
    
    window._checkoutLocation = location;
    window._checkoutTotal = total;
    
    const checkoutContent = document.getElementById('checkoutContent');
    if (!checkoutContent) return;
    
    let locationDisplay = '';
    if (location.source === 'gps') {
        locationDisplay = '📍 GPS Location Detected';
    } else if (location.city) {
        locationDisplay = `${location.city}, ${location.region || ''} - ${location.pincode || ''}`;
    } else {
        locationDisplay = `${CONFIG.store.city}, ${CONFIG.store.state} - ${CONFIG.store.pincode}`;
    }
    
    checkoutContent.innerHTML = `
        <h3>📦 Checkout</h3>
        <p class="checkout-subtitle">Complete your order</p>
        
        <div class="delivery-options">
            <div class="delivery-option selected" data-type="home" onclick="selectDeliveryOption('home', this)">
                <div class="option-icon">🚚</div>
                <div>Delivery</div>
                <div style="font-size:10px;">Address Par</div>
            </div>
            <div class="delivery-option" data-type="pickup" onclick="selectDeliveryOption('pickup', this)">
                <div class="option-icon">🏬</div>
                <div>Pickup</div>
                <div style="font-size:10px;">Khud Jaunga</div>
            </div>
        </div>
        
        <div class="checkout-form">
            <div class="form-group">
                <span class="form-icon">👤</span>
                <input type="text" id="checkoutName" placeholder="Apna naam likho..." value="${userDetails.name || ''}">
            </div>
            <div class="form-group">
                <span class="form-icon">📞</span>
                <input type="tel" id="checkoutPhone" placeholder="Phone number..." value="${userDetails.phone || ''}">
            </div>
            <div class="form-group">
                <span class="form-icon">🏘️</span>
                <input type="text" id="checkoutCity" placeholder="Gaon ya Shehar ka naam..." value="${userDetails.city || ''}">
            </div>
            <div class="form-group">
                <textarea id="checkoutAddress" placeholder="Full address (optional)...">${userDetails.address || ''}</textarea>
            </div>
        </div>
        
        <div class="auto-location">
            <span class="loc-icon">📍</span>
            <div>
                <div class="loc-text">${locationDisplay}</div>
                <div class="loc-auto">(Auto-detected from your device)</div>
            </div>
        </div>
        
        <p style="font-weight:600;font-size:14px;margin-bottom:8px;">💰 Payment Method:</p>
        <div class="payment-options">
            <div class="payment-option selected" data-payment="cod" onclick="selectPayment('cod', this)">
                <div class="pay-icon">💵</div>
                <div>COD</div>
            </div>
            <div class="payment-option" data-payment="qr" onclick="selectPayment('qr', this)">
                <div class="pay-icon">📱</div>
                <div>QR Code</div>
            </div>
            <div class="payment-option" data-payment="upi" onclick="selectPayment('upi', this)">
                <div class="pay-icon">📲</div>
                <div>UPI Pay</div>
            </div>
            <div class="payment-option" data-payment="gpay" onclick="selectPayment('gpay', this)">
                <div class="pay-icon">🏦</div>
                <div>Google Pay</div>
            </div>
            <div class="payment-option" data-payment="paytm" onclick="selectPayment('paytm', this)">
                <div class="pay-icon">📞</div>
                <div>Paytm</div>
            </div>
        </div>
        
        <div id="qrSection" style="display:none;"></div>
        
        <div class="form-group">
            <textarea id="checkoutInstructions" placeholder="📝 Special Instructions (Optional)..."></textarea>
        </div>
        
        <div class="checkout-summary">
            📋 <strong>${cart.length} items</strong> · Total: <span class="summary-text">${Utils.formatPrice(total)}</span> · 
            <span id="summaryPayment">💵 COD</span>
        </div>
        
        <button class="btn btn-primary btn-lg" style="width:100%;" onclick="placeOrder()">
            ✅ PLACE ORDER
        </button>
    `;
    
    window._selectedDelivery = 'home';
    window._selectedPayment = 'cod';
    
    UI.showPopup('checkoutPopupOverlay');
}

function selectDeliveryOption(type, element) {
    window._selectedDelivery = type;
    document.querySelectorAll('.delivery-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
}

function selectPayment(method, element) {
    window._selectedPayment = method;
    document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    
    const summaryPayment = document.getElementById('summaryPayment');
    const paymentNames = { cod: '💵 COD', qr: '📱 QR Code', upi: '📲 UPI', gpay: '🏦 GPay', paytm: '📞 Paytm' };
    if (summaryPayment) summaryPayment.textContent = paymentNames[method] || '💵 COD';
    
    const qrSection = document.getElementById('qrSection');
    if (method === 'qr' && qrSection) {
        qrSection.style.display = 'block';
        qrSection.innerHTML = `
            <div class="qr-display">
                <div class="qr-code" style="background:#f5f5f5;display:flex;align-items:center;justify-content:center;">
                    <span style="font-size:60px;">📱</span>
                </div>
                <div class="qr-amount">Pay ${Utils.formatPrice(window._checkoutTotal)}</div>
                <div class="qr-upi">UPI ID: quickdukan@upi</div>
            </div>
        `;
    } else if (qrSection) {
        qrSection.style.display = 'none';
    }
}

function placeOrder() {
    const name = document.getElementById('checkoutName')?.value?.trim();
    const phone = document.getElementById('checkoutPhone')?.value?.trim();
    const city = document.getElementById('checkoutCity')?.value?.trim();
    const address = document.getElementById('checkoutAddress')?.value?.trim();
    const instructions = document.getElementById('checkoutInstructions')?.value?.trim();
    
    // Validation
    if (!name) return alert('⚠️ Naam to likho!');
    if (!phone) return alert('⚠️ Phone number do!');
    if (!city && window._selectedDelivery === 'home') return alert('⚠️ City/Village name to batao!');
    
    // Save user details
    Storage.setUserDetails({ name, phone, city, address });
    
    const selectedItems = Cart.getSelected();
    const total = Cart.getSelectedTotal();
    const location = window._checkoutLocation || {};
    
    const orderData = {
        orderRef: Utils.generateOrderRef(),
        items: selectedItems.map(item => ({
            id: item.id,
            name: item.name,
            weight: item.weight,
            price: item.price,
            quantity: item.quantity,
            image: item.image
        })),
        total: total,
        payment: window._selectedPayment === 'cod' ? 'Cash on Delivery' : 
                 window._selectedPayment === 'qr' ? 'QR Code Payment' :
                 window._selectedPayment === 'upi' ? 'UPI Payment' :
                 window._selectedPayment === 'gpay' ? 'Google Pay' : 'Paytm',
        deliveryType: window._selectedDelivery,
        customer: {
            name: name,
            phone: phone,
            city: city,
            address: address || city,
            pincode: location.pincode || CONFIG.store.pincode,
            instructions: instructions
        },
        location: location
    };
    
    // Send to WhatsApp
    WhatsApp.sendOrder(orderData);
    
    // Close checkout
    UI.hidePopup('checkoutPopupOverlay');
    
    // Show success
    showOrderSuccess(orderData);
}

function showOrderSuccess(orderData) {
    const successDetails = document.getElementById('successDetails');
    if (successDetails) {
        successDetails.innerHTML = `
            <p>📋 <strong>Order Ref:</strong> ${orderData.orderRef}</p>
            <p>💰 <strong>Total:</strong> ${Utils.formatPrice(orderData.total)}</p>
            <p>💵 <strong>Payment:</strong> ${orderData.payment}</p>
            <p>🚚 <strong>Delivery:</strong> ${orderData.deliveryType === 'pickup' ? 'Store Pickup' : 'Home Delivery'}</p>
            <p>⏰ <strong>Expected:</strong> ${CONFIG.delivery.estimatedTime}</p>
            <p>✅ WhatsApp message sent!</p>
        `;
    }
    
    UI.showPopup('successPopupOverlay');
    Utils.playSuccessSound();
    
    // Update cart badge
    UI.updateCartBadge();
}

// ========== MY ORDERS ==========

async function loadMyOrders() {
    const ordersContent = document.getElementById('ordersContent');
    if (!ordersContent) return;
    
    const orders = Storage.getOrders();
    const location = await Utils.getUserLocation();
    
    let locationDisplay = '';
    if (location.city) {
        locationDisplay = `${location.city}, ${location.region || ''} - ${location.pincode || ''}`;
    } else {
        locationDisplay = `${CONFIG.store.city}, ${CONFIG.store.state}`;
    }
    
    let html = `
        <h3>📋 My Orders</h3>
        <p class="orders-location">📍 Your Location: ${locationDisplay} (Auto-detected) ✅</p>
    `;
    
    if (orders.length === 0) {
        html += `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3>No orders yet!</h3>
                <p>Kuch to order karo! 🛍️</p>
                <a href="index.html" class="btn btn-primary">Start Shopping</a>
            </div>
        `;
    } else {
        orders.forEach(order => {
            const statusClass = order.status === 'confirmed' ? 'status-confirmed' :
                               order.status === 'processing' ? 'status-processing' :
                               order.status === 'out' ? 'status-out' : 'status-delivered';
            
            let itemsHTML = order.items.map(item => 
                `<div class="mini-item"><span>${Utils.truncateText(item.name, 20)} × ${item.quantity}</span><span>${Utils.formatPrice(item.price * item.quantity)}</span></div>`
            ).join('');
            
            html += `
                <div class="order-card">
                    <div class="order-card-header">
                        <span>📅 ${order.date}</span>
                        <span class="order-ref">🆔 ${order.orderRef}</span>
                        <span class="order-status ${statusClass}">${order.status.toUpperCase()}</span>
                    </div>
                    <div class="order-status-bar">
                        <span class="status-step ${order.status === 'confirmed' || order.status === 'processing' || order.status === 'out' || order.status === 'delivered' ? 'done' : ''} ${order.status === 'confirmed' ? 'current' : ''}">✅ Confirmed</span>
                        <span class="status-step ${order.status === 'processing' || order.status === 'out' || order.status === 'delivered' ? 'done' : ''} ${order.status === 'processing' ? 'current' : ''}">🔄 Processing</span>
                        <span class="status-step ${order.status === 'out' || order.status === 'delivered' ? 'done' : ''} ${order.status === 'out' ? 'current' : ''}">🚚 Out</span>
                        <span class="status-step ${order.status === 'delivered' ? 'done' : ''} ${order.status === 'delivered' ? 'current' : ''}">✅ Delivered</span>
                    </div>
                    <div class="order-items-mini">${itemsHTML}</div>
                    <div class="order-total-row">
                        <span>💰 Total</span>
                        <span>${Utils.formatPrice(order.total)}</span>
                    </div>
                    <div style="font-size:11px;color:var(--text-grey);margin-top:4px;">
                        🚚 ${order.deliveryType === 'pickup' ? 'Store Pickup' : 'Home Delivery'} | 
                        💵 ${order.payment}
                    </div>
                </div>
            `;
        });
    }
    
    ordersContent.innerHTML = html;
}