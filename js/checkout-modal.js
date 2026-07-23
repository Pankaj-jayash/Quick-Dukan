var CheckoutModal = {
    currentProduct: null,
    currentCart: null,
    deliveryType: 'home',
    paymentMethod: 'cash',
    detectedLocation: null,

    open: function(productOrCart) {
        if (productOrCart && productOrCart.id) {
            this.currentProduct = productOrCart;
            var qty = productOrCart.quantity || 1;
            this.currentCart = { items: [{ id: productOrCart.id, name: productOrCart.name, price: productOrCart.price, weight: productOrCart.weight, quantity: qty, icon: productOrCart.icon }], totalItems: qty, totalAmount: productOrCart.price * qty };
        } else {
            var cart = Cart.getCart();
            if (cart.totalItems === 0) { alert('Cart is empty!'); return; }
            this.currentCart = cart;
            this.currentProduct = null;
        }
        this.renderModal();
        document.getElementById('checkoutModal').classList.add('active');
        this.loadSavedDetails();
        this.autoDetectLocation();
    },

    close: function() {
        var modal = document.getElementById('checkoutModal');
        if (modal) modal.classList.remove('active');
    },

    renderModal: function() {
        var old = document.getElementById('checkoutModal');
        if (old) old.remove();
        var html = '<div class="modal-overlay" id="checkoutModal" onclick="if(event.target===this)CheckoutModal.close()"><div class="modal-container" onclick="event.stopPropagation()"><div class="modal-header"><h2 class="modal-title">📦 Quick Checkout</h2><button class="modal-close" onclick="CheckoutModal.close()">✕</button></div><div class="modal-body">';
        html += '<div class="delivery-options"><div class="delivery-option-card selected" id="modalHome" onclick="CheckoutModal.selectDelivery(\'home\')"><span class="option-icon">🚚</span><span class="option-title">Home Delivery</span></div><div class="delivery-option-card" id="modalPickup" onclick="CheckoutModal.selectDelivery(\'pickup\')"><span class="option-icon">🏬</span><span class="option-title">Store Pickup</span></div></div>';
        html += '<div id="modalPickupInfo" style="display:none;font-size:12px;color:#166534;background:#F0FDF4;padding:8px;border-radius:8px;margin-bottom:10px;">📍 Pickup: Near Ram Mandir, Bhopal | ⏰ 8AM-9PM</div>';
        html += '<div class="location-status" id="modalLocationStatus"><span class="location-dot searching"></span> <span id="modalLocationText">Detecting location...</span></div>';
        html += '<div class="form-group"><input type="text" class="form-input" id="modalName" placeholder="Full Name *"></div>';
        html += '<div class="form-group"><input type="tel" class="form-input" id="modalPhone" placeholder="10-digit Phone *" maxlength="10"></div>';
        html += '<div class="form-group" id="modalAddressGroup"><input type="text" class="form-input" id="modalAddress" placeholder="Delivery Address *"></div>';
        html += '<div class="form-group"><textarea class="form-textarea" id="modalInstructions" placeholder="Instructions (optional)" rows="2"></textarea></div>';
        html += '<div class="payment-options"><div class="payment-option selected" id="modalPayCash" onclick="CheckoutModal.selectPayment(\'cash\')"><span class="pay-icon">💵</span><span class="pay-title">Cash</span></div><div class="payment-option" id="modalPayQR" onclick="CheckoutModal.selectPayment(\'qr\')"><span class="pay-icon">📱</span><span class="pay-title">QR/UPI</span></div><div class="payment-option" id="modalPayPhonePe" onclick="CheckoutModal.selectPayment(\'phonepe\')"><span class="pay-icon">💸</span><span class="pay-title">PhonePe</span></div></div>';
        html += '<div id="modalQR" style="display:none;text-align:center;margin:10px 0;"><img src="' + CONFIG.payments.qrCodeImage + '" style="width:110px;height:110px;" onerror="this.style.display=\'none\'"><p style="font-size:11px;">Scan & Pay</p></div>';
        html += '<div class="order-summary" style="margin:10px 0;font-size:13px;"><strong>📋 Order:</strong> ' + this.currentCart.items.map(function(i){return i.name+' x'+i.quantity;}).join(', ') + '<br><strong>Total: ₹' + this.currentCart.totalAmount + '</strong></div>';
        html += '<button class="whatsapp-order-btn" onclick="CheckoutModal.placeOrder()">💬 Order via WhatsApp</button>';
        html += '</div></div></div>';
        document.body.insertAdjacentHTML('beforeend', html);
    },

    selectDelivery: function(type) {
        this.deliveryType = type;
        document.getElementById('modalHome').classList.toggle('selected', type==='home');
        document.getElementById('modalPickup').classList.toggle('selected', type==='pickup');
        document.getElementById('modalPickupInfo').style.display = type==='pickup' ? 'block' : 'none';
        document.getElementById('modalAddressGroup').style.display = type==='home' ? 'block' : 'none';
    },

    selectPayment: function(method) {
        this.paymentMethod = method;
        document.getElementById('modalPayCash').classList.toggle('selected', method==='cash');
        document.getElementById('modalPayQR').classList.toggle('selected', method==='qr');
        document.getElementById('modalPayPhonePe').classList.toggle('selected', method==='phonepe');
        document.getElementById('modalQR').style.display = (method==='qr'||method==='cash') ? 'block' : 'none';
    },

    loadSavedDetails: function() {
        var saved = JSON.parse(localStorage.getItem('quickdukan_customer') || '{}');
        if (saved.name) document.getElementById('modalName').value = saved.name;
        if (saved.phone) document.getElementById('modalPhone').value = saved.phone;
    },

    autoDetectLocation: function() {
        var self = this;
        if (!navigator.geolocation) { document.getElementById('modalLocationText').textContent = 'Enter address manually.'; return; }
        navigator.geolocation.getCurrentPosition(function(pos) {
            self.detectedLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + pos.coords.latitude + '&lon=' + pos.coords.longitude)
                .then(function(r) { return r.json(); })
                .then(function(data) {
                    if (data && data.display_name) {
                        document.getElementById('modalAddress').value = data.display_name;
                        document.getElementById('modalLocationText').textContent = '📍 Location detected';
                    }
                }).catch(function() {});
        }, function() {
            document.getElementById('modalLocationText').textContent = 'Could not detect. Enter manually.';
        }, { timeout: 8000 });
    },

    placeOrder: function() {
        var name = document.getElementById('modalName').value.trim();
        var phone = document.getElementById('modalPhone').value.trim();
        var address = this.deliveryType === 'home' ? document.getElementById('modalAddress').value.trim() : 'Store Pickup';
        var instructions = document.getElementById('modalInstructions').value.trim();
        if (!name || !phone || (this.deliveryType === 'home' && !address)) { alert('Please fill all required fields.'); return; }
        localStorage.setItem('quickdukan_customer', JSON.stringify({ name: name, phone: phone, address: address }));
        var orderData = {
            items: this.currentCart.items,
            total: this.currentCart.totalAmount,
            totalItems: this.currentCart.totalItems,
            deliveryType: this.deliveryType,
            paymentMethod: this.paymentMethod,
            customer: { name: name, phone: phone, address: address, instructions: instructions },
            location: this.detectedLocation,
            orderRef: 'QD' + Date.now(),
            dateTime: new Date().toLocaleString('en-IN')
        };
        WhatsApp.sendOrder(orderData);
        if (!this.currentProduct) Cart.clearCart();
        this.close();
        window.location.href = 'success.html';
    }
};